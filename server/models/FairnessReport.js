const mongoose = require('mongoose');

const fairnessReportSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  totalCandidates: { type: Number, default: 0 },
  selectedCandidates: { type: Number, default: 0 },
  selectionThreshold: { type: Number, default: 70 },

  // Proxy risk summary
  proxyRisksDetected: { type: Number, default: 0 },
  proxyRiskCategories: [{ category: String, count: Number }],

  // PII removal summary
  piiRemovedCount: { type: Number, default: 0 },
  piiCategories: [{ type: String }],

  // Fairness metrics (computed from audit dataset if available)
  demographicParityDifference: { type: Number, default: null },
  disparateImpactRatio: { type: Number, default: null },
  selectionRates: mongoose.Schema.Types.Mixed,

  // Overall assessment
  fairnessStatus: {
    type: String,
    enum: ['Passed', 'Review Recommended', 'Not Configured'],
    default: 'Passed',
  },
  protectedAttributesUsedInRanking: { type: Boolean, default: false },

  generatedAt: { type: Date, default: Date.now },
  modelVersion: { type: String, default: '1.0.0' },
}, { timestamps: true });

module.exports = mongoose.model('FairnessReport', fairnessReportSchema);
