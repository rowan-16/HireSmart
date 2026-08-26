const mongoose = require('mongoose');

const candidateAnalysisSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

  // Extracted features (job-relevant only)
  extractedData: {
    skills: [String],
    technicalSkills: [String],
    softSkills: [String],
    yearsOfExperience: { type: Number, default: 0 },
    experienceDetails: [{
      role: String,
      company: String,
      years: Number,
      responsibilities: [String],
    }],
    projects: [{ title: String, description: String, technologies: [String] }],
    education: [{ degree: String, field: String, institution: String }],
    certifications: [String],
    achievements: [String],
    technologies: [String],
  },

  // Scores
  scores: {
    skillScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    educationScore: { type: Number, default: 0 },
    semanticScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
  },

  // Matching details
  matchedSkills: [String],
  missingRequiredSkills: [String],
  missingPreferredSkills: [String],
  skillMatchPercentage: { type: Number, default: 0 },

  // Confidence
  confidence: { type: Number, default: 0 },
  confidenceLabel: { type: String, default: 'Low' },

  // Threshold
  matchCategory: { type: String, default: 'Low Match' },

  // Embedding stored reference
  embeddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Embedding' },

  modelVersion: { type: String, default: '1.0.0' },
}, { timestamps: true });

module.exports = mongoose.model('CandidateAnalysis', candidateAnalysisSchema);
