/**
 * Recall@K — fraction of all relevant results that appear in top-K.
 */
function recallAtK(rankedCandidateIds, relevantIds, k) {
  if (relevantIds.length === 0) return 0;
  const topK = rankedCandidateIds.slice(0, k);
  const found = topK.filter(id => relevantIds.includes(id)).length;
  return Math.round((found / relevantIds.length) * 1000) / 1000;
}

module.exports = { recallAtK };
