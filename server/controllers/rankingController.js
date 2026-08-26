const Ranking = require('../models/Ranking');
const CandidateAnalysis = require('../models/CandidateAnalysis');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const RecruiterOverride = require('../models/RecruiterOverride');
const { rankCandidates } = require('../services/ranking/rankingEngine');
const { generateExplanation } = require('../services/explainability/explanationGenerator');
const { logEvent } = require('../services/audit/auditLogger');

// POST /api/ranking/:jobId — generate/refresh ranking
exports.generateRanking = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const analyses = await CandidateAnalysis.find({ jobId });
    if (!analyses.length) return res.status(400).json({ success: false, message: 'No analyzed candidates found for this job' });

    const candidates = analyses.map(a => ({
      candidateId: a.candidateId,
      resumeId: a.resumeId,
      analysisId: a._id,
      finalScore: a.scores.finalScore,
      confidence: a.confidence,
      scores: a.scores,
    }));

    const ranked = rankCandidates(candidates);

    // Upsert rankings
    const rankingDocs = [];
    for (const r of ranked) {
      const doc = await Ranking.findOneAndUpdate(
        { jobId, candidateId: r.candidateId },
        {
          jobId, candidateId: r.candidateId,
          resumeId: r.resumeId, analysisId: r.analysisId,
          rank: r.rank, finalScore: r.finalScore,
          confidence: r.confidence, matchCategory: r.matchCategory,
          scoreBreakdown: r.scores,
          protectedAttributesUsed: false, piiRemoved: true,
          proxyRiskLevel: 'Low', modelVersion: '1.0.0',
          rankedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      rankingDocs.push(doc);
    }

    await logEvent('ranking_generated', { jobId, userId: req.user._id, metadata: { count: ranked.length } });
    res.json({ success: true, ranking: rankingDocs.sort((a, b) => a.rank - b.rank) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/ranking/:jobId
exports.getRanking = async (req, res) => {
  try {
    const rankings = await Ranking.find({ jobId: req.params.jobId }).sort('rank');
    res.json({ success: true, ranking: rankings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/candidates/:candidateId/explanation
exports.getCandidateExplanation = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { jobId } = req.query;

    const analysis = await CandidateAnalysis.findOne({ candidateId, ...(jobId ? { jobId } : {}) });
    if (!analysis) return res.status(404).json({ success: false, message: 'Candidate analysis not found' });

    const ranking = await Ranking.findOne({ candidateId, ...(jobId ? { jobId } : {}) });
    const job = await Job.findById(analysis.jobId);

    if (!ranking || !job) return res.status(404).json({ success: false, message: 'Ranking or job not found' });

    const explanation = generateExplanation(analysis, ranking, job);
    await logEvent('recruiter_viewed_explanation', { candidateId, jobId: analysis.jobId, userId: req.user._id });

    res.json({ success: true, candidateId, explanation, analysis, ranking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/candidates/:candidateId
exports.getCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const analysis = await CandidateAnalysis.findOne({ candidateId });
    if (!analysis) return res.status(404).json({ success: false, message: 'Candidate not found' });
    const ranking = await Ranking.findOne({ candidateId });
    await logEvent('recruiter_viewed_candidate', { candidateId, userId: req.user._id });
    res.json({ success: true, analysis, ranking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/candidates/:candidateId/audit
exports.getCandidateAudit = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find({ candidateId: req.params.candidateId }).sort('-timestamp');
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ranking/:candidateId/override
exports.overrideRanking = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { jobId, newRank, reason } = req.body;
    if (!newRank || !reason) return res.status(400).json({ success: false, message: 'newRank and reason are required' });

    const ranking = await Ranking.findOne({ candidateId, jobId });
    if (!ranking) return res.status(404).json({ success: false, message: 'Ranking not found' });

    const override = await RecruiterOverride.create({
      jobId, candidateId, rankingId: ranking._id,
      overriddenBy: req.user._id,
      originalRank: ranking.rank,
      newRank, originalScore: ranking.finalScore, reason,
    });

    await Ranking.findByIdAndUpdate(ranking._id, { isOverridden: true, overrideId: override._id, rank: newRank });
    await logEvent('recruiter_override', {
      candidateId, jobId, userId: req.user._id,
      metadata: { originalRank: ranking.rank, newRank, reason },
    });

    res.json({ success: true, override });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/candidates/compare
exports.compareCandidates = async (req, res) => {
  try {
    const { ids, jobId } = req.query;
    const candidateIds = ids ? ids.split(',') : [];
    if (candidateIds.length < 2 || candidateIds.length > 5) {
      return res.status(400).json({ success: false, message: 'Provide 2 to 5 candidate IDs' });
    }
    const analyses = await CandidateAnalysis.find({ candidateId: { $in: candidateIds }, ...(jobId ? { jobId } : {}) });
    const rankings = await Ranking.find({ candidateId: { $in: candidateIds }, ...(jobId ? { jobId } : {}) });
    res.json({ success: true, analyses, rankings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
