const ModelEvaluation = require('../models/ModelEvaluation');
const Ranking = require('../models/Ranking');
const { precisionAtK } = require('../services/evaluation/precisionAtK');
const { recallAtK } = require('../services/evaluation/recallAtK');
const { ndcgAtK } = require('../services/evaluation/ndcg');
const { logEvent } = require('../services/audit/auditLogger');

// GET /api/evaluation/:jobId
exports.getEvaluation = async (req, res) => {
  try {
    const evaluation = await ModelEvaluation.findOne({ jobId: req.params.jobId }).sort('-evaluatedAt');
    res.json({ success: true, evaluation, message: evaluation ? null : 'Evaluation dataset not configured. Provide labelled data to compute ranking metrics.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/evaluation/:jobId — run evaluation with labelled data
exports.runEvaluation = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { labelledData, k = 5 } = req.body;

    if (!labelledData || !Array.isArray(labelledData) || labelledData.length === 0) {
      return res.status(400).json({ success: false, message: 'labelledData array required: [{ candidateId, relevant: bool }]' });
    }

    const rankings = await Ranking.find({ jobId }).sort('rank');
    if (!rankings.length) return res.status(400).json({ success: false, message: 'No rankings found for this job' });

    const rankedIds = rankings.map(r => r.candidateId);
    const relevantIds = labelledData.filter(d => d.relevant).map(d => d.candidateId);

    const pAtK = precisionAtK(rankedIds, relevantIds, k);
    const rAtK = recallAtK(rankedIds, relevantIds, k);
    const ndcg = ndcgAtK(rankedIds, relevantIds, k);

    const evaluation = await ModelEvaluation.findOneAndUpdate(
      { jobId },
      {
        jobId, evaluatedBy: req.user._id,
        k, hasLabelledData: true,
        precisionAtK: pAtK, recallAtK: rAtK, ndcg,
        rankingAgreement: null, topKRelevance: pAtK,
        labelledData, modelVersion: '1.0.0',
        evaluatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await logEvent('evaluation_run', { jobId, userId: req.user._id, metadata: { k, pAtK, rAtK, ndcg } });
    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
