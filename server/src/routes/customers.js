const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { customerSchema } = require('../validators/customer');
const { generateSummary } = require('../services/llm');
const { authenticateToken } = require('../middleware/auth');
const {
  enqueuePdfJob,
  generateAndAttachPdf,
  isRabbitEnabled,
} = require('../services/pdfQueue');
const { enqueueMailJob, sendMailNow } = require('../services/mailQueue');

// GET all customers
router.get('/', async (_req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    // Validate input
    const validatedData = customerSchema.parse(req.body);

    // Check registration limit (1000)
    const existingCount = await Customer.countDocuments();
    if (existingCount >= 1000) {
      return res.status(409).json({
        success: false,
        error: 'Registration limit of 1000 has been reached',
      });
    }

    // Generate LLM summary
    let summary = '';
    try {
      summary = await generateSummary(validatedData);
    } catch (llmErr) {
      console.error('Summary generation error:', llmErr);
      summary = `${validatedData.firstName} ${validatedData.lastName} - Customer registered for KYC verification.`;
    }

    // Create customer with summary
    const customer = new Customer({
      ...validatedData,
      summary,
    });
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (err) {
    console.error('Validation or DB error:', err);

    if (err.errors && Array.isArray(err.errors)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors.map(e => e.message),
      });
    }

    if (err.issues) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
      });
    }

    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// DELETE customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true, message: 'Customer removed' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Approve customer
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date(), rejectedAt: null, pdfPath: null, pdfGeneratedAt: null },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    let queued = false;
    if (isRabbitEnabled()) {
      try {
        await enqueuePdfJob(customer._id.toString());
        queued = true;
      } catch (queueErr) {
        console.warn('Queue unavailable, generating inline:', queueErr.message);
      }
    }
    if (queued) {
      return res
        .status(202)
        .json({ success: true, message: 'Customer approved, PDF queued', data: customer });
    }
    const updated = await generateAndAttachPdf(customer);
    try {
      if (isRabbitEnabled()) {
        await enqueueMailJob({
          customerId: updated._id.toString(),
          type: 'approved',
          pdfPath: updated.pdfPath,
        });
      } else {
        await sendMailNow({
          customerId: updated._id.toString(),
          type: 'approved',
          pdfPath: updated.pdfPath,
        });
      }
    } catch (mailErr) {
      console.warn('Mail send failed:', mailErr.message);
    }
    res.json({ success: true, message: 'Customer approved', data: updated });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Failed to approve customer' });
  }
});

// Reject customer
router.patch('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectedAt: new Date(), approvedAt: null },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    try {
      if (isRabbitEnabled()) {
        await enqueueMailJob({ customerId: customer._id.toString(), type: 'rejected' });
      } else {
        await sendMailNow({ customerId: customer._id.toString(), type: 'rejected' });
      }
    } catch (mailErr) {
      console.warn('Mail send failed:', mailErr.message);
    }
    res.json({ success: true, message: 'Customer rejected', data: customer });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Failed to reject customer' });
  }
});

// Generate PDF request
router.post('/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (customer.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved customers can generate PDFs' });
    }

    customer.pdfPath = null;
    customer.pdfGeneratedAt = null;
    await customer.save();

    if (isRabbitEnabled()) {
      try {
        await enqueuePdfJob(customer._id.toString());
        return res.status(202).json({ message: 'PDF generation queued' });
      } catch (queueErr) {
        console.warn('Queue unavailable, generating inline:', queueErr.message);
      }
    }

    const updated = await generateAndAttachPdf(customer);
    try {
      if (isRabbitEnabled()) {
        await enqueueMailJob({ customerId: updated._id.toString(), type: 'approved', pdfPath: updated.pdfPath });
      } else {
        await sendMailNow({ customerId: updated._id.toString(), type: 'approved', pdfPath: updated.pdfPath });
      }
    } catch (mailErr) {
      console.warn('Mail send failed:', mailErr.message);
    }
    return res.json({
      message: 'PDF generated successfully',
      pdfPath: updated.pdfPath,
      data: updated,
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
