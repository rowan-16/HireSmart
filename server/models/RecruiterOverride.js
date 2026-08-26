const mongoose = require('mongoose');

const recruiterOverrideSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: String, required: true },
  rankingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ranking' },
  overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalRank: { type: Number, required: true },
  newRank: { type: Number, required: true },
  originalScore: { type: Number },
  reason: { type: String, required: true },
  overrideTimestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('RecruiterOverride', recruiterOverrideSchema);
