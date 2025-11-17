require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./db');
const { startPdfWorker, isRabbitEnabled } = require('./services/pdfQueue');
const { startMailWorker } = require('./services/mailQueue');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/admin', require('./routes/admin'));

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'ServerError' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  console.log('Booting server...');
  await connectDB(process.env.MONGODB_URI);
  if (isRabbitEnabled()) {
    try {
      await startPdfWorker();
      await startMailWorker();
    } catch (err) {
      console.warn('Queue workers not started:', err.message || err);
    }
  } else {
    console.warn('RabbitMQ disabled; synchronous PDF generation enabled.');
  }
  app.listen(PORT, () => console.log(`API ready http://localhost:${PORT}`));
})();
