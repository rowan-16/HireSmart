/**
 * Ranking Engine — sorts candidates deterministically.
 * Same input + model version = same ranking.
 */
const { classifyScore } = require('./threshold');

const MODEL_VERSION = '1.0.0';

function rankCandidates(candidates) {
  // candidates: array of { candidateId, finalScore, confidence, scores }
  const sorted = [...candidates].sort((a, b) => {
    // Primary: final score
    if (Math.abs(b.finalScore - a.finalScore) > 0.01) return b.finalScore - a.finalScore;
    // Tie-break 1: confidence
    if (Math.abs(b.confidence - a.confidence) > 0.01) return b.confidence - a.confidence;
    // Tie-break 2: skill score
    if (Math.abs((b.scores?.skillScore || 0) - (a.scores?.skillScore || 0)) > 0.01) {
      return (b.scores?.skillScore || 0) - (a.scores?.skillScore || 0);
    }
    // Tie-break 3: lexicographic by candidateId (deterministic)
    return a.candidateId.localeCompare(b.candidateId);
  });

  return sorted.map((c, idx) => ({
    ...c,
    rank: idx + 1,
    matchCategory: classifyScore(c.finalScore).label,
    modelVersion: MODEL_VERSION,
  }));
}

module.exports = { rankCandidates, MODEL_VERSION };
