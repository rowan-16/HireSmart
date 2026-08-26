/**
 * Text Similarity Engine
 * Implements TF-IDF, cosine similarity, and Jaccard similarity.
 * Used for lexical skill matching between job requirements and resumes.
 */

// ─── Tokenization ────────────────────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

// ─── TF (Term Frequency) ─────────────────────────────────────────────────────

function computeTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(k => { tf[k] /= total; });
  return tf;
}

// ─── IDF (Inverse Document Frequency) ────────────────────────────────────────

function computeIDF(docs) {
  const idf = {};
  const N = docs.length;
  const allTerms = new Set(docs.flat());
  allTerms.forEach(term => {
    const count = docs.filter(doc => doc.includes(term)).length;
    idf[term] = Math.log((N + 1) / (count + 1)) + 1;
  });
  return idf;
}

// ─── TF-IDF Vector ───────────────────────────────────────────────────────────

function computeTFIDF(tokens, idf) {
  const tf = computeTF(tokens);
  const tfidf = {};
  Object.keys(tf).forEach(term => {
    tfidf[term] = tf[term] * (idf[term] || 1);
  });
  return tfidf;
}

// ─── Cosine Similarity ───────────────────────────────────────────────────────

function cosineSimilarity(vecA, vecB) {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, normA = 0, normB = 0;
  allKeys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Jaccard Similarity ──────────────────────────────────────────────────────

function jaccardSimilarity(setA, setB) {
  const sA = new Set(setA.map(s => s.toLowerCase()));
  const sB = new Set(setB.map(s => s.toLowerCase()));
  const intersection = [...sA].filter(x => sB.has(x)).length;
  const union = new Set([...sA, ...sB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Skill Match ─────────────────────────────────────────────────────────────

function computeSkillMatch(requiredSkills, preferredSkills, candidateSkills) {
  const req = requiredSkills.map(s => s.toLowerCase());
  const pref = preferredSkills.map(s => s.toLowerCase());
  const cand = candidateSkills.map(s => s.toLowerCase());

  const matchedRequired = req.filter(s => cand.includes(s));
  const matchedPreferred = pref.filter(s => cand.includes(s));
  const missingRequired = req.filter(s => !cand.includes(s));
  const missingPreferred = pref.filter(s => !cand.includes(s));

  // Required skills weighted 80%, preferred 20%
  const reqScore = req.length > 0 ? (matchedRequired.length / req.length) : 1;
  const prefScore = pref.length > 0 ? (matchedPreferred.length / pref.length) : 1;
  const skillScore = (reqScore * 0.8 + prefScore * 0.2) * 100;

  return {
    skillScore: Math.round(skillScore * 10) / 10,
    matchedRequired,
    matchedPreferred,
    missingRequired,
    missingPreferred,
    skillMatchPercentage: req.length > 0 ? Math.round((matchedRequired.length / req.length) * 100) : 100,
  };
}

// ─── Full text TF-IDF cosine similarity ──────────────────────────────────────

function textCosineSimilarity(textA, textB) {
  const tokA = tokenize(textA);
  const tokB = tokenize(textB);
  const idf = computeIDF([tokA, tokB]);
  const vecA = computeTFIDF(tokA, idf);
  const vecB = computeTFIDF(tokB, idf);
  return cosineSimilarity(vecA, vecB);
}

module.exports = {
  tokenize,
  cosineSimilarity,
  jaccardSimilarity,
  computeSkillMatch,
  textCosineSimilarity,
  computeTFIDF,
  computeIDF,
};
