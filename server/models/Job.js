const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  requiredSkills: [{ type: String }],
  preferredSkills: [{ type: String }],
  minExperience: { type: Number, default: 0 },
  educationRequirement: { type: String, default: '' },
  certifications: [{ type: String }],
  scoringWeights: {
    skills: { type: Number, default: 0.50 },
    experience: { type: Number, default: 0.25 },
    projects: { type: Number, default: 0.15 },
    education: { type: Number, default: 0.10 },
  },
  minScreeningScore: { type: Number, default: 50 },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateCount: { type: Number, default: 0 },
  modelVersion: { type: String, default: '1.0.0' },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
