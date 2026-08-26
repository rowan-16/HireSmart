const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'resume_uploaded', 'resume_extracted', 'resume_anonymized',
      'candidate_analyzed', 'candidate_ranked', 'fairness_check_executed',
      'recruiter_viewed_explanation', 'recruiter_viewed_candidate',
      'recruiter_override', 'job_created', 'job_updated',
      'ranking_generated', 'evaluation_run', 'login', 'register', 'user_deleted',
    ],
  },
  candidateId: { type: String },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modelVersion: { type: String, default: '1.0.0' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  protectedAttributesUsed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
