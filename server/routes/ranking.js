const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateRanking, getRanking, getCandidateExplanation,
  getCandidate, getCandidateAudit, overrideRanking, compareCandidates,
} = require('../controllers/rankingController');

router.use(protect);
router.post('/job/:jobId/generate', generateRanking);
router.get('/job/:jobId', getRanking);
router.get('/compare', compareCandidates);
router.get('/candidates/:candidateId', getCandidate);
router.get('/candidates/:candidateId/explanation', getCandidateExplanation);
router.get('/candidates/:candidateId/audit', getCandidateAudit);
router.post('/candidates/:candidateId/override', overrideRanking);

module.exports = router;
