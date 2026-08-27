const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getFairnessReport, getFairnessHistory } = require('../controllers/fairnessController');
const { getAuditLogs, getOverrides, getDashboardStats } = require('../controllers/auditController');
const { getEvaluation, runEvaluation } = require('../controllers/evaluationController');

router.use(protect);

// Fairness
router.get('/fairness/:jobId', getFairnessReport);
router.get('/fairness/:jobId/history', getFairnessHistory);

// Audit (Restricted to Admin / 'The Head' only)
router.get('/audit', authorize('admin'), getAuditLogs);
router.get('/audit/overrides', authorize('admin'), getOverrides);
router.get('/dashboard/stats', getDashboardStats);

// Evaluation
router.get('/evaluation/:jobId', getEvaluation);
router.post('/evaluation/:jobId', runEvaluation);

module.exports = router;
