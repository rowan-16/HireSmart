const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  resumeUrl: { type: String, default: '' },
  parsedSkills: [{ type: String }],
  yearsOfExperience: { type: Number, default: 0 },
  matchPercentage: { type: Number, default: 0 },
  scores: {
    skillScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    educationScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['applied', 'interview', 'accepted', 'rejected'],
    default: 'applied',
  },
  interviewDetails: {
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    meetLink: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  rejectionFeedback: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
