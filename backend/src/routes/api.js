import { Router } from "express";
import { db, graph, decisionById, activeDataset } from "../services/memoryStore.js";
import { semanticSearch } from "../services/searchService.js";
import { answerQuestion } from "../services/llmService.js";
import { computeRiskScores } from "../services/riskService.js";
import { isNeo4jEnabled, fetchGraph } from "../services/neo4jService.js";
import { isVectorSearchEnabled, vectorSearch } from "../services/vectorService.js";

const router = Router();

// GET /api/meta - which dataset / engines are currently active (for UI badges)
router.get("/meta", (req, res) => {
  res.json({
    dataset: activeDataset, // "demo" | "kaggle-enron"
    datasetLabel:
      activeDataset === "kaggle-enron"
        ? "Kaggle · Enron Email Corpus"
        : "Demo seed data",
    counts: {
      decisions: db.decisions.length,
      meetings: db.meetings.length,
      people: db.people.length,
    },
  });
});

// GET /api/timeline - all decisions, newest first
router.get("/timeline", (req, res) => {
  const timeline = [...db.decisions].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ timeline });
});

// GET /api/decisions/:id - full decision detail with linked artifacts
router.get("/decisions/:id", (req, res) => {
  const decision = decisionById(req.params.id);
  if (!decision) return res.status(404).json({ error: "Decision not found" });

  const linked = decision.linked;
  res.json({
    decision,
    meetings: db.meetings.filter((m) => linked.meetings?.includes(m.id)),
    commits: db.commits.filter((c) => linked.commits?.includes(c.id)),
    prs: db.prs.filter((p) => linked.prs?.includes(p.id)),
    tasks: db.tasks.filter((t) => linked.tasks?.includes(t.id)),
    docs: db.docs.filter((d) => linked.docs?.includes(d.id)),
  });
});

// GET /api/search?q=...&type=decision
router.get("/search", async (req, res) => {
  const { q = "", type = null, limit = 8 } = req.query;
  if (!q.trim()) return res.json({ query: q, results: [] });

  try {
    const results = isVectorSearchEnabled()
      ? await vectorSearch(q, { limit: Number(limit) })
      : semanticSearch(q, { limit: Number(limit), typeFilter: type });
    res.json({ query: q, results, engine: isVectorSearchEnabled() ? "qdrant" : "keyword" });
  } catch (err) {
    console.error("Search failed, falling back to keyword search:", err.message);
    const results = semanticSearch(q, { limit: Number(limit), typeFilter: type });
    res.json({ query: q, results, engine: "keyword-fallback" });
  }
});

// POST /api/chat  { question }
router.post("/chat", async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }
  try {
    const result = await answerQuestion(question);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

// GET /api/graph - full knowledge graph (nodes + edges)
router.get("/graph", async (req, res) => {
  if (isNeo4jEnabled()) {
    try {
      const realGraph = await fetchGraph();
      return res.json({ ...realGraph, engine: "neo4j" });
    } catch (err) {
      console.error("Neo4j fetch failed, falling back to in-memory graph:", err.message);
    }
  }
  res.json({ ...graph, engine: "in-memory" });
});

// GET /api/risk - knowledge risk / bus-factor scores
router.get("/risk", (req, res) => {
  res.json(computeRiskScores());
});

// GET /api/people - roster (used for onboarding assistant context)
router.get("/people", (req, res) => {
  res.json({ people: db.people });
});

export default router;
