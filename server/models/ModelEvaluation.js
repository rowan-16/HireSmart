const mongoose = require('mongoose');

const modelEvaluationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  k: { type: Number, default: 5 },
  hasLabelledData: { type: Boolean, default: false },
  precisionAtK: { type: Number, default: null },
  recallAtK: { type: Number, default: null },
  ndcg: { type: Number, default: null },
  rankingAgreement: { type: Number, default: null },
  topKRelevance: { type: Number, default: null },
  labelledData: [{ candidateId: String, relevant: Boolean }],
  notes: { type: String, default: '' },
  modelVersion: { type: String, default: '1.0.0' },
  evaluatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ModelEvaluation', modelEvaluationSchema);
