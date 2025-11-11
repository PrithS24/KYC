const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { customerSchema } = require('../validators/customer');
const { generateSummary } = require('../services/llm');

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
      data: customer
    });
  } catch (err) {
    console.error('Validation or DB error:', err);
    
    // Handle validation errors
    if (err.errors && Array.isArray(err.errors)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors.map(e => e.message)
      });
    }
    
    // Handle Zod validation errors
    if (err.issues) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

module.exports = router;
