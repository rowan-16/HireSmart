const { generateFairnessReport } = require('../services/fairness/fairnessAudit');
const FairnessReport = require('../models/FairnessReport');
const Ranking = require('../models/Ranking');

// GET /api/fairness/:jobId
exports.getFairnessReport = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { threshold, groupData } = req.query;
    const selectionThreshold = parseFloat(threshold) || 70;
    const groups = groupData ? JSON.parse(groupData) : null;
    const { report, fairnessAssessment } = await generateFairnessReport(jobId, selectionThreshold, groups);
    res.json({ success: true, report, fairnessAssessment, disclaimer: 'Our system is designed to reduce demographic bias by excluding protected attributes from ranking and auditing model outcomes. It does not claim to eliminate bias.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fairness/:jobId/history
exports.getFairnessHistory = async (req, res) => {
  try {
    const reports = await FairnessReport.find({ jobId: req.params.jobId }).sort('-createdAt').limit(10);
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
