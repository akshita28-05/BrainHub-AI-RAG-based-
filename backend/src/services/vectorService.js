import { QdrantClient } from "@qdrant/js-client-rest";

/**
 * Real semantic search using:
 *   - BGE embeddings generated LOCALLY via @xenova/transformers (free, no API key, runs on CPU)
 *   - Qdrant (free Cloud cluster or local Docker) as the vector store
 *
 * Active only when QDRANT_URL is set in .env. Falls back to the keyword-based
 * searchService.js otherwise. The embedding model downloads once (~130MB)
 * the first time you run the ingestion script, then it's cached locally.
 */

const COLLECTION = "brainhub_documents";
let embedder = null;
let qdrant = null;

export function isVectorSearchEnabled() {
  return Boolean(process.env.QDRANT_URL);
}

function getQdrant() {
  if (!qdrant) {
    qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY || undefined,
    });
  }
  return qdrant;
}

async function getEmbedder() {
  if (!embedder) {
    // Lazy import: keeps startup fast when vector search isn't enabled,
    // and avoids requiring the (largish) transformers package unless needed.
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5");
  }
  return embedder;
}

export async function embedText(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/** Creates the collection (if missing) and upserts all documents with embeddings. */
export async function indexDocuments(documents) {
  const client = getQdrant();
  const vectorSize = 384; // bge-small-en-v1.5 output dimension

  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION);
  if (!exists) {
    await client.createCollection(COLLECTION, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
  }

  const points = [];
  for (const doc of documents) {
    const vector = await embedText(`${doc.title}. ${doc.text}`);
    points.push({
      id: points.length + 1,
      vector,
      payload: { ...doc, ref: undefined }, // ref is dropped: not needed post-retrieval
    });
  }

  await client.upsert(COLLECTION, { wait: true, points });
  return points.length;
}

export async function vectorSearch(query, { limit = 5 } = {}) {
  const client = getQdrant();
  const vector = await embedText(query);
  const results = await client.search(COLLECTION, { vector, limit });
  return results.map((r) => ({ ...r.payload, score: r.score }));
}
