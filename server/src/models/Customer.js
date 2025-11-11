const { Schema, model } = require('mongoose');

const CustomerSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, lowercase: true, index: true },
    phone:     { type: String },
    dateOfBirth: { type: Date },
    nationality: { type: String },
    gender: { type: String, enum: ['Male','Female','Other'] },
    age: { type: Number },                // <-- ADDED
    notes: { type: String },
    photoPath: { type: String },          // <-- ADDED (stored file path)
    summary: { type: String }             // LLM one-liner
  },
  { timestamps: true }
);

module.exports = model('Customer', CustomerSchema);
