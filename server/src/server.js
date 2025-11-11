require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./db');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/customers', require('./routes/customers'));

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'ServerError' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  console.log('🔧 Booting server...');
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => console.log(`🚀 API http://localhost:${PORT}`));
})();
