const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const CandidateAnalysis = require('../models/CandidateAnalysis');
const Embedding = require('../models/Embedding');
const Ranking = require('../models/Ranking');
const { parseResume } = require('../services/resume/parser');
const { detectAndRemovePII, detectProxyRisks } = require('../services/resume/anonymizer');
const { extractResumeFeatures } = require('../services/resume/extractor');
const { computeSkillMatch } = require('../services/matching/textSimilarity');
const { generateEmbedding, computeSemanticSimilarity } = require('../services/matching/embeddings');
const { computeRubricScore } = require('../services/ranking/rubricScorer');
const { computeConfidence } = require('../services/ranking/confidence');
const { classifyScore } = require('../services/ranking/threshold');
const { logEvent } = require('../services/audit/auditLogger');

// Generate unique anonymous candidate ID
function generateCandidateId() {
  const num = Math.floor(Math.random() * 900) + 100;
  return `C-${num}`;
}

// Full processing pipeline for a single resume
async function processResume(resumeDoc, job) {
  try {
    // 1. Extract text
    await Resume.findByIdAndUpdate(resumeDoc._id, { status: 'extracting' });
    const rawText = await parseResume(resumeDoc.filePath, resumeDoc.fileType);
    await logEvent('resume_extracted', { candidateId: resumeDoc.candidateId, jobId: job._id, metadata: { chars: rawText.length } });

    // 2. Anonymize
    await Resume.findByIdAndUpdate(resumeDoc._id, { status: 'anonymizing', rawText });
    const { anonymizedText, piiDetected } = detectAndRemovePII(rawText);
    const proxyRisks = detectProxyRisks(rawText);
    await Resume.findByIdAndUpdate(resumeDoc._id, { anonymizedText, piiDetected, proxyRisks });
    await logEvent('resume_anonymized', { candidateId: resumeDoc.candidateId, jobId: job._id, metadata: { piiCount: piiDetected.length } });

    // 3. Extract features from anonymized text
    await Resume.findByIdAndUpdate(resumeDoc._id, { status: 'analyzing' });
    const features = extractResumeFeatures(anonymizedText);

    // 4. Skill matching
    const skillMatch = computeSkillMatch(job.requiredSkills || [], job.preferredSkills || [], features.skills);

    // 5. Generate embedding & semantic similarity
    await Resume.findByIdAndUpdate(resumeDoc._id, { status: 'matching' });
    const jobText = `${job.title} ${job.description} ${job.requiredSkills.join(' ')}`;
    const resumeText = `${features.skills.join(' ')} ${features.experienceDetails.map(e => e.role).join(' ')} ${features.projects.map(p => p.title).join(' ')}`;

    let semanticScore = 0;
    let embeddingVector = null;
    try {
      [embeddingVector] = await Promise.all([generateEmbedding(resumeText)]);
      if (embeddingVector) {
        const jobEmbedding = await generateEmbedding(jobText);
        if (jobEmbedding) {
          const { cosineSimilarityArrays } = require('../services/matching/embeddings');
          const sim = cosineSimilarityArrays(new Float32Array(embeddingVector), new Float32Array(jobEmbedding));
          semanticScore = Math.round(Math.max(0, Math.min(1, sim)) * 1000) / 10;
        }
      }
    } catch (embErr) {
      console.warn('[Resume] Embedding failed, using text similarity fallback:', embErr.message);
      const { textCosineSimilarity } = require('../services/matching/textSimilarity');
      semanticScore = Math.round(textCosineSimilarity(jobText, resumeText) * 100 * 10) / 10;
    }

    // Store embedding
    let embeddingDoc = null;
    if (embeddingVector) {
      embeddingDoc = await Embedding.findOneAndUpdate(
        { candidateId: resumeDoc.candidateId, jobId: job._id, type: 'resume' },
        { candidateId: resumeDoc.candidateId, jobId: job._id, type: 'resume', text: resumeText.substring(0, 500), vector: embeddingVector },
        { upsert: true, new: true }
      );
    }

    // 6. Rubric scoring
    const partialAnalysis = {
      scores: { skillScore: skillMatch.skillScore },
      extractedData: features,
      matchedSkills: skillMatch.matchedRequired,
    };
    const scores = computeRubricScore(partialAnalysis, job, semanticScore);

    // 7. Confidence
    const fullAnalysis = {
      matchedSkills: skillMatch.matchedRequired,
      extractedData: features,
      scores,
    };
    const { confidence, confidenceLabel, confidenceNote } = computeConfidence(fullAnalysis, scores);

    // 8. Match category
    const { label: matchCategory } = classifyScore(scores.finalScore);

    // Save analysis
    const analysis = await CandidateAnalysis.findOneAndUpdate(
      { candidateId: resumeDoc.candidateId, jobId: job._id },
      {
        candidateId: resumeDoc.candidateId,
        resumeId: resumeDoc._id,
        jobId: job._id,
        extractedData: features,
        scores: { ...scores, skillScore: skillMatch.skillScore },
        matchedSkills: skillMatch.matchedRequired,
        missingRequiredSkills: skillMatch.missingRequired,
        missingPreferredSkills: skillMatch.missingPreferred,
        skillMatchPercentage: skillMatch.skillMatchPercentage,
        confidence,
        confidenceLabel,
        embeddingId: embeddingDoc?._id,
        matchCategory,
        modelVersion: '1.0.0',
      },
      { upsert: true, new: true }
    );

    await Resume.findByIdAndUpdate(resumeDoc._id, { status: 'complete' });
    await logEvent('candidate_analyzed', {
      candidateId: resumeDoc.candidateId, jobId: job._id,
      metadata: { finalScore: scores.finalScore, confidence, matchCategory },
    });

    return { analysis, scores, confidence, confidenceLabel, matchCategory };
  } catch (err) {
    await Resume.findByIdAndUpdate(resumeDoc._id, { status: 'error' });
    console.error('[ResumeController] Processing error for', resumeDoc.candidateId, ':', err.message);
    throw err;
  }
}

// POST /api/resumes/upload
exports.uploadResumes = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const resumeDocs = [];
    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      let candidateId;
      // Ensure uniqueness
      do { candidateId = generateCandidateId(); } while (await Resume.findOne({ candidateId }));

      const resume = await Resume.create({
        jobId,
        candidateId,
        originalFilename: file.originalname,
        fileType: ext,
        filePath: file.path,
        status: 'uploaded',
        uploadedBy: req.user._id,
      });
      resumeDocs.push(resume);
      await logEvent('resume_uploaded', { candidateId, jobId, userId: req.user._id, metadata: { filename: file.originalname } });
    }

    // Update job candidate count
    await Job.findByIdAndUpdate(jobId, { $inc: { candidateCount: resumeDocs.length } });

    // Process in background (non-blocking response)
    res.status(201).json({ success: true, message: `${resumeDocs.length} resume(s) uploaded and processing started`, resumes: resumeDocs.map(r => ({ id: r._id, candidateId: r.candidateId, filename: r.originalFilename, status: r.status })) });

    // Process asynchronously
    for (const resume of resumeDocs) {
      processResume(resume, job).catch(err => console.error('[Upload] Async processing error:', err.message));
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/resumes/:jobId
exports.getResumesByJob = async (req, res) => {
  try {
    const resumes = await Resume.find({ jobId: req.params.jobId }).select('-rawText -anonymizedText');
    res.json({ success: true, resumes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/resumes/status/:id
exports.getResumeStatus = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).select('candidateId status piiDetected proxyRisks');
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
