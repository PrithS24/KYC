const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('Missing MONGODB_URI');
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { dbName: 'kyc' });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    console.warn('⚠️  MongoDB is required for persistence. Please install and start MongoDB.');
    console.warn('⚠️  Windows: Download from https://www.mongodb.com/try/download/community');
    console.warn(String.raw`⚠️  Then run: mongod --dbpath "C:\data\db"`);
    throw err; // Still throw the error so the server doesn't start
  }
}
module.exports = { connectDB };

