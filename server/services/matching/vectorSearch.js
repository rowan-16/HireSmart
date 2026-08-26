/**
 * Vector Search — retrieves top candidates by semantic similarity.
 * Computes cosine similarity in Node.js using stored MongoDB vectors.
 */
const Embedding = require('../../models/Embedding');
const { cosineSimilarityArrays } = require('./embeddings');

async function findTopCandidates(jobEmbeddingVector, jobId, topK = 20) {
  try {
    const candidateEmbeddings = await Embedding.find({ jobId, type: 'resume' });
    if (!candidateEmbeddings.length) return [];

    const scored = candidateEmbeddings.map(emb => {
      const sim = emb.vector && emb.vector.length > 0
        ? cosineSimilarityArrays(new Float32Array(jobEmbeddingVector), new Float32Array(emb.vector))
        : 0;
      return { candidateId: emb.candidateId, semanticSimilarity: Math.round(sim * 1000) / 10 };
    });

    return scored.sort((a, b) => b.semanticSimilarity - a.semanticSimilarity).slice(0, topK);
  } catch (err) {
    console.error('[VectorSearch] Error:', err.message);
    return [];
  }
}

module.exports = { findTopCandidates };
