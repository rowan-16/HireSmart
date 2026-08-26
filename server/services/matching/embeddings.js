/**
 * Semantic Embedding Engine
 * Uses @xenova/transformers (all-MiniLM-L6-v2) for local sentence embeddings.
 * All inference is on-device — no external API calls, no API keys.
 * The model (~23MB) is downloaded on first use and cached locally.
 */

let pipeline = null;
let pipelineLoading = false;
let pipelineReady = false;

// Cosine similarity between two Float32Array / number arrays
function cosineSimilarityArrays(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Lazy-load the pipeline once
async function getPipeline() {
  if (pipelineReady && pipeline) return pipeline;
  if (pipelineLoading) {
    // Wait for ongoing load
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (pipelineReady) { clearInterval(interval); resolve(); }
      }, 200);
    });
    return pipeline;
  }
  pipelineLoading = true;
  try {
    const { pipeline: createPipeline } = await import('@xenova/transformers');
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    pipelineReady = true;
    console.log('[Embeddings] all-MiniLM-L6-v2 loaded successfully');
  } catch (err) {
    console.error('[Embeddings] Failed to load model:', err.message);
    pipeline = null;
    pipelineReady = false;
  } finally {
    pipelineLoading = false;
  }
  return pipeline;
}

// Mean pooling over token embeddings
function meanPool(output, dims) {
  const [batchSize, seqLen, hiddenSize] = dims;
  const result = new Float32Array(hiddenSize);
  for (let j = 0; j < seqLen; j++) {
    for (let k = 0; k < hiddenSize; k++) {
      result[k] += output[j * hiddenSize + k];
    }
  }
  for (let k = 0; k < hiddenSize; k++) result[k] /= seqLen;
  return result;
}

async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) return null;
  try {
    const pipe = await getPipeline();
    if (!pipe) return null;
    const truncated = text.substring(0, 512); // model max
    const output = await pipe(truncated, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('[Embeddings] Generation error:', err.message);
    return null;
  }
}

async function computeSemanticSimilarity(textA, textB) {
  try {
    const [embA, embB] = await Promise.all([generateEmbedding(textA), generateEmbedding(textB)]);
    if (!embA || !embB) return 0;
    const sim = cosineSimilarityArrays(embA, embB);
    return Math.max(0, Math.min(1, sim));
  } catch (err) {
    console.error('[Embeddings] Similarity error:', err.message);
    return 0;
  }
}

module.exports = { generateEmbedding, computeSemanticSimilarity, cosineSimilarityArrays };
