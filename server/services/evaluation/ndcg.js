/**
 * NDCG@K — Normalized Discounted Cumulative Gain.
 * Measures ranking quality weighted by position.
 */

function dcg(rankedIds, relevantIds, k) {
  let gain = 0;
  rankedIds.slice(0, k).forEach((id, idx) => {
    const rel = relevantIds.includes(id) ? 1 : 0;
    gain += rel / Math.log2(idx + 2); // log2(rank + 1)
  });
  return gain;
}

function idealDCG(relevantIds, k) {
  const idealRanked = relevantIds.slice(0, k);
  return dcg(idealRanked, relevantIds, k);
}

function ndcgAtK(rankedCandidateIds, relevantIds, k) {
  if (relevantIds.length === 0) return 0;
  const actual = dcg(rankedCandidateIds, relevantIds, k);
  const ideal = idealDCG(relevantIds, k);
  if (ideal === 0) return 0;
  return Math.round((actual / ideal) * 1000) / 1000;
}

module.exports = { ndcgAtK };
