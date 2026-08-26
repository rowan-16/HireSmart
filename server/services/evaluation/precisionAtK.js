/**
 * Precision@K — fraction of top-K results that are relevant.
 */
function precisionAtK(rankedCandidateIds, relevantIds, k) {
  const topK = rankedCandidateIds.slice(0, k);
  const relevant = topK.filter(id => relevantIds.includes(id)).length;
  return k > 0 ? Math.round((relevant / k) * 1000) / 1000 : 0;
}

module.exports = { precisionAtK };
