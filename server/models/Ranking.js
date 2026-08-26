const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: String, required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateAnalysis' },

  rank: { type: Number, required: true },
  finalScore: { type: Number, required: true },
  confidence: { type: Number, required: true },
  matchCategory: { type: String },

  scoreBreakdown: {
    skillScore: Number,
    experienceScore: Number,
    projectScore: Number,
    educationScore: Number,
    semanticScore: Number,
  },

  isOverridden: { type: Boolean, default: false },
  overrideId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterOverride' },

  // Fairness audit fields (never used in scoring)
  protectedAttributesUsed: { type: Boolean, default: false },
  piiRemoved: { type: Boolean, default: true },
  proxyRiskLevel: { type: String, default: 'Low' },

  modelVersion: { type: String, default: '1.0.0' },
  rankedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Ranking', rankingSchema);
