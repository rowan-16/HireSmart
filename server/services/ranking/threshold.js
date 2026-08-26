/**
 * Threshold Engine — configurable match category classification.
 */

const DEFAULT_THRESHOLDS = [
  { min: 80, max: 100, label: 'Strong Match', color: '#22e3a3' },
  { min: 65, max: 79.9, label: 'Moderate Match', color: '#ffd166' },
  { min: 50, max: 64.9, label: 'Weak Match', color: '#ff6a3d' },
  { min: 0, max: 49.9, label: 'Low Match', color: '#ff2770' },
];

function classifyScore(score, thresholds = DEFAULT_THRESHOLDS) {
  const t = thresholds.find(th => score >= th.min && score <= th.max);
  return t ? { label: t.label, color: t.color } : { label: 'Low Match', color: '#ff2770' };
}

function meetsScreeningThreshold(score, minScreeningScore = 50) {
  return score >= minScreeningScore;
}

module.exports = { classifyScore, meetsScreeningThreshold, DEFAULT_THRESHOLDS };
