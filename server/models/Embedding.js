const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  type: { type: String, enum: ['resume', 'job'], required: true },
  text: { type: String },
  vector: [{ type: Number }], // dense float array
  model: { type: String, default: 'all-MiniLM-L6-v2' },
}, { timestamps: true });

module.exports = mongoose.model('Embedding', embeddingSchema);
