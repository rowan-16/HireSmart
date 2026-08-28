const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: String, required: true, unique: true }, // e.g. C-024
  originalFilename: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  filePath: { type: String, required: true },
  rawText: { type: String },           // original extracted text
  anonymizedText: { type: String },    // after PII removal
  piiDetected: [{
    type: { type: String },            // name, email, phone, etc.
    value: { type: String },
    replacement: { type: String },
  }],
  proxyRisks: [{
    text: { type: String },
    risk: { type: String },
    category: { type: String },
  }],
  status: {
    type: String,
    enum: ['uploaded', 'extracting', 'anonymizing', 'analyzing', 'matching', 'ranked', 'complete', 'error'],
    default: 'uploaded',
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeData: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
