import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DATA_SOURCE=kaggle uses the Enron-derived dataset produced by
// `npm run ingest:kaggle` (see scripts/ingest_kaggle.py). Falls back to the
// hand-written demo seed if that file hasn't been generated yet, so the app
// never crashes just because someone forgot to run the ingest script.
const KAGGLE_PATH = path.join(__dirname, "../data/seed.kaggle.json");
const DEMO_PATH = path.join(__dirname, "../data/seed.json");

let activeDataset = "demo";
let dataPath = DEMO_PATH;

if (process.env.DATA_SOURCE === "kaggle") {
  if (fs.existsSync(KAGGLE_PATH)) {
    dataPath = KAGGLE_PATH;
    activeDataset = "kaggle-enron";
  } else {
    console.warn(
      "\n⚠️  DATA_SOURCE=kaggle but backend/src/data/seed.kaggle.json doesn't exist yet.\n" +
        "   Run `npm run ingest:kaggle` first. Falling back to demo seed data for now.\n"
    );
  }
}

const raw = fs.readFileSync(dataPath, "utf-8");
const db = JSON.parse(raw);

// ---- Lookups -------------------------------------------------------------

function personById(id) {
  return db.people.find((p) => p.id === id) || null;
}

function decisionById(id) {
  return db.decisions.find((d) => d.id === id) || null;
}

// ---- Flattened, searchable "documents" -----------------------------------
// In production these are the chunks you'd embed with BGE and upsert into
// Qdrant. Here we build the same shape so swapping in a real vector DB later
// is a drop-in replacement (see services/searchService.js).

function buildDocuments() {
  const docs = [];

  for (const d of db.decisions) {
    const author = personById(d.author);
    docs.push({
      id: `decision:${d.id}`,
      type: "decision",
      title: d.title,
      date: d.date,
      author: author?.name || "Unknown",
      text: `${d.title}. ${d.summary} Impact: ${d.impact}`,
      tags: d.tags,
      ref: d,
    });
  }

  for (const m of db.meetings) {
    docs.push({
      id: `meeting:${m.id}`,
      type: "meeting",
      title: m.title,
      date: m.date,
      author: m.attendees.map((a) => personById(a)?.name).join(", "),
      text: `${m.title}. ${m.notes}`,
      tags: [],
      ref: m,
    });
  }

  for (const c of db.commits) {
    const author = personById(c.author);
    docs.push({
      id: `commit:${c.id}`,
      type: "commit",
      title: c.hash,
      date: c.date,
      author: author?.name || "Unknown",
      text: c.message,
      tags: [],
      ref: c,
    });
  }

  for (const doc of db.docs) {
    docs.push({
      id: `doc:${doc.id}`,
      type: "document",
      title: doc.title,
      date: doc.date,
      author: "",
      text: doc.title,
      tags: [],
      ref: doc,
    });
  }

  return docs;
}

const documents = buildDocuments();

// ---- Knowledge graph (nodes + edges) --------------------------------------
// This mirrors what would be modeled as (:Decision)-[:DISCUSSED_IN]->(:Meeting)
// etc. in Neo4j. See services/graphService.js for the Cypher equivalent.

function buildGraph() {
  const nodes = [];
  const edges = [];

  const pushNode = (id, label, type, extra = {}) =>
    nodes.push({ id, label, type, ...extra });

  db.people.forEach((p) => pushNode(`person:${p.id}`, p.name, "person", { role: p.role }));
  db.decisions.forEach((d) => pushNode(`decision:${d.id}`, d.title, "decision", { date: d.date }));
  db.meetings.forEach((m) => pushNode(`meeting:${m.id}`, m.title, "meeting", { date: m.date }));
  db.commits.forEach((c) => pushNode(`commit:${c.id}`, c.hash, "commit", { date: c.date }));
  db.prs.forEach((p) => pushNode(`pr:${p.id}`, p.title, "pr", { date: p.date }));
  db.tasks.forEach((t) => pushNode(`task:${t.id}`, t.title, "task", {}));
  db.docs.forEach((doc) => pushNode(`doc:${doc.id}`, doc.title, "document", { date: doc.date }));

  for (const d of db.decisions) {
    edges.push({ source: `person:${d.author}`, target: `decision:${d.id}`, type: "MADE" });
    (d.linked.meetings || []).forEach((id) =>
      edges.push({ source: `decision:${d.id}`, target: `meeting:${id}`, type: "DISCUSSED_IN" })
    );
    (d.linked.commits || []).forEach((id) =>
      edges.push({ source: `decision:${d.id}`, target: `commit:${id}`, type: "IMPLEMENTED_BY" })
    );
    (d.linked.tasks || []).forEach((id) =>
      edges.push({ source: `decision:${d.id}`, target: `task:${id}`, type: "TRACKED_AS" })
    );
    (d.linked.prs || []).forEach((id) =>
      edges.push({ source: `decision:${d.id}`, target: `pr:${id}`, type: "SHIPPED_IN" })
    );
    (d.linked.docs || []).forEach((id) =>
      edges.push({ source: `decision:${d.id}`, target: `doc:${id}`, type: "DOCUMENTED_IN" })
    );
  }

  return { nodes, edges };
}

const graph = buildGraph();

export { db, documents, graph, personById, decisionById, activeDataset };
