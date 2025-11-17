const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const Customer = require('../models/Customer');

const QUEUE = 'mail_jobs';
let channelPromise;
let rabbitAvailable = true;

const isRabbitEnabled = () =>
  rabbitAvailable && String(process.env.ENABLE_RABBITMQ).toLowerCase() === 'true';

const disableRabbit = reason => {
  if (!rabbitAvailable) return;
  rabbitAvailable = false;
  console.warn(`RabbitMQ disabled: ${reason}`);
};

async function getChannel() {
  if (!isRabbitEnabled()) throw new Error('RabbitMQ is disabled');
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

async function enqueueMailJob(payload) {
  if (!isRabbitEnabled()) throw new Error('RabbitMQ is disabled');
  const channel = await getChannel();
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendMailNow(payload) {
  const transport = buildTransport();
  if (!transport) throw new Error('SMTP not configured');
  const customer = await Customer.findById(payload.customerId);
  if (!customer) throw new Error(`Customer ${payload.customerId} not found`);

  const from = process.env.FROM_EMAIL || 'no-reply@example.com';
  const to = customer.email;
  if (!to) throw new Error('Customer email missing');

  if (payload.type === 'approved') {
    const attachments = [];
    if (payload.pdfPath) {
      const abs = path.join(__dirname, '../../', payload.pdfPath.replace(/^\//, ''));
      if (fs.existsSync(abs)) {
        attachments.push({ filename: path.basename(abs), path: abs });
      }
    }
    await transport.sendMail({
      from,
      to,
      subject: 'KYC Approved & PDF Attached',
      text: `Hello ${customer.firstName}, your KYC was approved. Summary: ${customer.summary || ''}`,
      attachments,
    });
  } else if (payload.type === 'rejected') {
    await transport.sendMail({
      from,
      to,
      subject: 'KYC Rejected',
      text: `Hello ${customer.firstName}, your KYC submission was rejected. Please resubmit with the required details.`,
    });
  }
}

async function startMailWorker() {
  if (!isRabbitEnabled()) {
    console.warn('RabbitMQ disabled; mail worker not started.');
    return;
  }
  let channel;
  try {
    channel = await getChannel();
  } catch (err) {
    console.warn(`Mail worker not started: ${err.message || err}`);
    return;
  }
  const transport = buildTransport();
  if (!transport) {
    console.warn('SMTP not configured; mail worker not started.');
    return;
  }

  channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        const customer = await Customer.findById(payload.customerId);
        if (!customer) throw new Error(`Customer ${payload.customerId} not found`);

        const from = process.env.FROM_EMAIL || 'no-reply@example.com';
        const to = customer.email;
        if (!to) throw new Error('Customer email missing');

        if (payload.type === 'approved') {
          const attachments = [];
          if (payload.pdfPath) {
            const abs = path.join(__dirname, '../../', payload.pdfPath.replace(/^\//, ''));
            if (fs.existsSync(abs)) {
              attachments.push({ filename: path.basename(abs), path: abs });
            }
          }
          await transport.sendMail({
            from,
            to,
            subject: 'KYC Approved & PDF Attached',
            text: `Hello ${customer.firstName}, your KYC was approved. Summary: ${customer.summary || ''}`,
            attachments,
          });
        } else if (payload.type === 'rejected') {
          await transport.sendMail({
            from,
            to,
            subject: 'KYC Rejected',
            text: `Hello ${customer.firstName}, your KYC submission was rejected. Please resubmit with the required details.`,
          });
        }
        channel.ack(msg);
      } catch (err) {
        console.error('Mail job failed:', err.message);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

module.exports = { enqueueMailJob, startMailWorker, isRabbitEnabled, sendMailNow };
