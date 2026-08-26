/**
 * Fairness Audit — generates comprehensive fairness report for a job.
 */
const FairnessReport = require('../../models/FairnessReport');
const Ranking = require('../../models/Ranking');
const Resume = require('../../models/Resume');
const { assessFairness } = require('./fairnessMetrics');
const { classifyProxyRiskLevel } = require('./proxyDetector');

async function generateFairnessReport(jobId, selectionThreshold = 70, groupData = null) {
  const rankings = await Ranking.find({ jobId });
  const resumes = await Resume.find({ jobId });

  const totalCandidates = rankings.length;
  const selectedCandidates = rankings.filter(r => r.finalScore >= selectionThreshold).length;

  // Aggregate proxy risks from resumes
  let totalProxyRisks = 0;
  const categoryCounts = {};
  const piiCategories = new Set();

  resumes.forEach(resume => {
    (resume.proxyRisks || []).forEach(r => {
      totalProxyRisks++;
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });
    (resume.piiDetected || []).forEach(p => {
      piiCategories.add(p.type);
    });
  });

  const proxyRiskCategories = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

  // Fairness metrics (only if group data provided — from external audit dataset)
  const fairnessAssessment = assessFairness(groupData);

  const report = await FairnessReport.findOneAndUpdate(
    { jobId },
    {
      jobId,
      totalCandidates,
      selectedCandidates,
      selectionThreshold,
      proxyRisksDetected: totalProxyRisks,
      proxyRiskCategories,
      piiRemovedCount: resumes.reduce((s, r) => s + (r.piiDetected || []).length, 0),
      piiCategories: [...piiCategories],
      demographicParityDifference: fairnessAssessment.metrics?.demographicParityDifference ?? null,
      disparateImpactRatio: fairnessAssessment.metrics?.disparateImpactRatio ?? null,
      selectionRates: fairnessAssessment.metrics?.rates ?? null,
      fairnessStatus: fairnessAssessment.status,
      protectedAttributesUsedInRanking: false,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { report, fairnessAssessment };
}

module.exports = { generateFairnessReport };
