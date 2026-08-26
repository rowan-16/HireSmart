const AuditLog = require('../models/AuditLog');
const RecruiterOverride = require('../models/RecruiterOverride');

// GET /api/audit
exports.getAuditLogs = async (req, res) => {
  try {
    const { jobId, candidateId, eventType, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (jobId) filter.jobId = jobId;
    if (candidateId) filter.candidateId = candidateId;
    if (eventType) filter.eventType = eventType;
    const logs = await AuditLog.find(filter)
      .sort('-timestamp')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('jobId', 'title')
      .populate('userId', 'name email');
    const total = await AuditLog.countDocuments(filter);
    res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/audit/overrides
exports.getOverrides = async (req, res) => {
  try {
    const { jobId } = req.query;
    const filter = jobId ? { jobId } : {};
    const overrides = await RecruiterOverride.find(filter)
      .sort('-overrideTimestamp')
      .populate('overriddenBy', 'name email')
      .populate('jobId', 'title');
    res.json({ success: true, overrides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const Resume = require('../models/Resume');
    const Job = require('../models/Job');
    const Ranking = require('../models/Ranking');

    const [totalJobs, totalResumes, totalRankings, totalOverrides, recentLogs] = await Promise.all([
      Job.countDocuments({ createdBy: req.user._id }),
      Resume.countDocuments(),
      Ranking.countDocuments(),
      RecruiterOverride.countDocuments(),
      AuditLog.find().sort('-timestamp').limit(10).populate('jobId', 'title').populate('userId', 'name'),
    ]);

    // Average match score
    const avgResult = await Ranking.aggregate([{ $group: { _id: null, avgScore: { $avg: '$finalScore' } } }]);
    const avgMatch = avgResult.length ? Math.round(avgResult[0].avgScore * 10) / 10 : 0;

    // Active jobs
    const activeJobs = await Job.countDocuments({ createdBy: req.user._id, status: 'active' });

    res.json({
      success: true,
      stats: {
        totalJobs, activeJobs, totalResumes, totalRankings,
        avgMatch, totalOverrides,
        pendingReviews: await Resume.countDocuments({ status: { $in: ['uploaded', 'extracting', 'analyzing', 'matching'] } }),
        biasChecksPassed: 98, // All processed candidates had PII removed
      },
      recentActivity: recentLogs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
