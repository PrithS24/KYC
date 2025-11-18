const amqp = require('amqplib');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Customer = require('../models/Customer');
const { enqueueMailJob } = require('./mailQueue');

const QUEUE = 'pdf_jobs';
let channelPromise;
let rabbitAvailable = true;

const isRabbitEnabled = () =>
  rabbitAvailable && String(process.env.ENABLE_RABBITMQ).toLowerCase() === 'true';

const disableRabbit = reason => {
  if (!rabbitAvailable) return;
  rabbitAvailable = false;
  console.warn(`RabbitMQ disabled: ${reason}`);
};

const getStorageDir = () => {
  const dir = process.env.PDF_STORAGE_PATH
    ? path.resolve(process.env.PDF_STORAGE_PATH)
    : path.join(__dirname, '../../pdfs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

async function getChannel() {
  if (!isRabbitEnabled()) {
    throw new Error('RabbitMQ is disabled');
  }
  if (!channelPromise) {
    channelPromise = (async () => {
      try {
        const url = process.env.RABBITMQ_URL || 'amqp://localhost';
        const connection = await amqp.connect(url);
        connection.on('error', err => disableRabbit(err.message));
        connection.on('close', () => disableRabbit('connection closed'));
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE, { durable: true });
        return channel;
      } catch (err) {
        channelPromise = null;
        disableRabbit(err.message || err);
        throw err;
      }
    })();
  }
  return channelPromise;
}

async function enqueuePdfJob(customerId, { notify = false } = {}) {
  if (!isRabbitEnabled()) {
    throw new Error('RabbitMQ is disabled');
  }
  const channel = await getChannel();
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify({ customerId, notify })), {
    persistent: true,
  });
}

async function startPdfWorker() {
  if (!isRabbitEnabled()) {
    console.warn('RabbitMQ disabled; PDF worker not started.');
    return;
  }
  let channel;
  try {
    channel = await getChannel();
  } catch (err) {
    console.warn(`PDF worker not started: ${err.message || err}`);
    return;
  }
  const storageDir = getStorageDir();

  channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;
      let parsed;
      try {
        parsed = JSON.parse(msg.content.toString());
      } catch {
        parsed = { customerId: msg.content.toString(), notify: true };
      }
      const { customerId, notify = true } = parsed;

      try {
        const customer = await Customer.findById(customerId);
        if (!customer) throw new Error(`Customer ${customerId} not found`);

        await generateAndAttachPdf(customer, storageDir);
        if (notify) {
          try {
            await enqueueMailJob({
              customerId,
              type: 'approved',
              pdfPath: customer.pdfPath,
            });
          } catch (mailErr) {
            console.warn('Mail enqueue after PDF failed:', mailErr.message || mailErr);
          }
        }
        channel.ack(msg);
      } catch (err) {
        console.error('PDF job failed:', err.message);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

function formatDate(value, withTime = false) {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    return withTime ? d.toLocaleString() : d.toLocaleDateString();
  } catch {
    return String(value);
  }
}

function generateCustomerPdf(customer, absolutePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(absolutePath);

    doc.pipe(stream);

    doc
      .fontSize(20)
      .text('KYC Customer Dossier', { align: 'center' })
      .moveDown();

    doc.fontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Customer ID: ${customer._id}`);
    doc.moveDown();

    doc.fontSize(14).text('Personal Information', { underline: true });
    doc.moveDown(0.5);

    const status = (customer.status || 'pending').toUpperCase();
    const lines = [
      ['Name', `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A'],
      ['Email', customer.email || 'N/A'],
      ['Phone', customer.phone || 'N/A'],
      ['Date of Birth', formatDate(customer.dateOfBirth)],
      ['Age / Gender', `${customer.age ?? 'N/A'} / ${customer.gender || 'N/A'}`],
      ['Nationality', customer.nationality || 'N/A'],
      ['Yearly Income', customer.yearlyIncome ? `$${customer.yearlyIncome}` : 'N/A'],
      ['Current Address', customer.currentAddress || 'N/A'],
      ['Permanent Address', customer.permanentAddress || 'N/A'],
      ['Status', status],
      ['Approved At', formatDate(customer.approvedAt, true)],
    ];

    lines.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').text(value || 'N/A');
    });

    doc.moveDown();
    doc.font('Helvetica-Bold').text('AI Summary');
    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .text(customer.summary || 'Summary not available.', { align: 'justify' });

    if (customer.notes) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Notes');
      doc.moveDown(0.5);
      doc.font('Helvetica').text(customer.notes, { align: 'justify' });
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function generateAndAttachPdf(customer, storageDir = getStorageDir()) {
  const fileName = `${customer._id}-${Date.now()}.pdf`;
  const absolutePath = path.join(storageDir, fileName);
  await generateCustomerPdf(customer, absolutePath);
  customer.pdfPath = `/pdfs/${fileName}`;
  customer.pdfGeneratedAt = new Date();
  await customer.save();
  return customer;
}

module.exports = {
  enqueuePdfJob,
  startPdfWorker,
  generateAndAttachPdf,
  isRabbitEnabled,
};
