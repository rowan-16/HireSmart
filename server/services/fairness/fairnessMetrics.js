/**
 * Fairness Metrics Engine
 * Computes selection rate, demographic parity, and disparate impact.
 * These metrics use a SEPARATE audit dataset — never ranking features.
 */

function computeSelectionRate(totalCount, selectedCount) {
  if (totalCount === 0) return 0;
  return Math.round((selectedCount / totalCount) * 1000) / 10;
}

function computeDemographicParityDifference(rateA, rateB) {
  return Math.round((Math.abs(rateA - rateB)) * 100) / 100;
}

function computeDisparateImpactRatio(rateA, rateB) {
  if (rateA === 0 || rateB === 0) return null;
  const ratio = Math.min(rateA, rateB) / Math.max(rateA, rateB);
  return Math.round(ratio * 1000) / 1000;
}

/**
 * Fairness assessment given selection data.
 * @param {Array} groups - [{ label: 'Group A', total: N, selected: M }, ...]
 * @returns fairness assessment object
 */
function assessFairness(groups) {
  if (!groups || groups.length < 2) {
    return {
      status: 'Not Configured',
      message: 'Evaluation dataset not configured. Provide labelled group data for fairness analysis.',
      metrics: null,
    };
  }

  const rates = groups.map(g => ({
    label: g.label,
    selectionRate: computeSelectionRate(g.total, g.selected),
    total: g.total,
    selected: g.selected,
  }));

  const maxRate = Math.max(...rates.map(r => r.selectionRate));
  const minRate = Math.min(...rates.map(r => r.selectionRate));
  const dpd = computeDemographicParityDifference(maxRate, minRate);
  const dir = computeDisparateImpactRatio(maxRate / 100, minRate / 100);

  // 80% rule: disparate impact < 0.8 is problematic
  let status = 'Passed';
  let message = 'Fairness Check Passed. No significant disparity detected.';
  if (dir !== null && dir < 0.8) {
    status = 'Review Recommended';
    message = 'Potential disparity detected — review recommended. Disparate impact ratio below 0.8 threshold.';
  } else if (dpd > 10) {
    status = 'Review Recommended';
    message = 'Demographic parity difference exceeds 10%. Review recommended.';
  }

  return { status, message, metrics: { rates, demographicParityDifference: dpd, disparateImpactRatio: dir } };
}

module.exports = { computeSelectionRate, computeDemographicParityDifference, computeDisparateImpactRatio, assessFairness };
