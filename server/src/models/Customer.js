const { Schema, model } = require('mongoose');

const CustomerSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, index: true },
    phone:     { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male','Female','Other'], required: true },
    age: { type: Number, required: true },
    yearlyIncome: { type: Number, required: true },
    notes: { type: String },
    currentAddress: { type: String, required: true, trim: true },
    permanentAddress: { type: String, required: true, trim: true },
    summary: { type: String }
  },
  { timestamps: true }
);

module.exports = model('Customer', CustomerSchema);
