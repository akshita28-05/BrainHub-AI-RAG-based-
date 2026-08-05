import { documents } from "./memoryStore.js";

/**
 * PRODUCTION PATH (not active by default - no network/API key in this env):
 *   1. Embed `query` with BGE (e.g. via a local server or HF inference API).
 *   2. `qdrantClient.search(collection, { vector, limit })`.
 *   3. Return the top-k matching documents with their scores.
 *
 * DEV/DEMO PATH (active now):
 *   A lightweight TF-IDF-ish scorer so search "just works" with zero setup.
 *   The function signature and return shape match what the Qdrant version
 *   would return, so routes/services never need to change when you swap it.
 */

function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "was", "were", "of", "to", "in", "on", "for",
  "and", "or", "why", "what", "who", "did", "does", "this", "that", "it",
]);

function scoreDocument(queryTokens, doc) {
  const docTokens = tokenize(`${doc.title} ${doc.text} ${doc.tags.join(" ")}`);
  let score = 0;
  for (const qt of queryTokens) {
    if (STOPWORDS.has(qt)) continue;
    const occurrences = docTokens.filter((t) => t === qt || t.includes(qt)).length;
    score += occurrences;
  }
  return score;
}

export function semanticSearch(query, { limit = 5, typeFilter = null } = {}) {
  const queryTokens = tokenize(query);
  let pool = documents;
  if (typeFilter) pool = pool.filter((d) => d.type === typeFilter);

  const scored = pool
    .map((doc) => ({ doc, score: scoreDocument(queryTokens, doc) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.doc.date) - new Date(a.doc.date))
    .slice(0, limit);

  // Fallback: if nothing matched keywords, surface the most recent decisions
  // so the UI never shows a dead end (mirrors a "no hits -> recent context" UX choice).
  if (scored.length === 0) {
    return documents
      .filter((d) => d.type === "decision")
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map((doc) => ({ ...doc, score: 0 }));
  }

  return scored.map(({ doc, score }) => ({ ...doc, score }));
}
