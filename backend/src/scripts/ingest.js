import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchRealCommits, fetchRealPullRequests, fetchRealIssues, derivDecisionsFromPRs } from "../services/githubIngest.js";
import { isNeo4jEnabled, syncGraph, closeDriver } from "../services/neo4jService.js";
import { isVectorSearchEnabled, indexDocuments } from "../services/vectorService.js";
import { db as seedDb } from "../services/memoryStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🧠 BrainHub AI ingestion starting...\n");

  let commits = seedDb.commits;
  let prs = seedDb.prs;
  let tasks = seedDb.tasks;
  let decisions = seedDb.decisions;
  const people = seedDb.people;
  const meetings = seedDb.meetings; // meetings have no public API source; kept as manual/seed input
  const docs = seedDb.docs;

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    console.log(`→ Pulling real data from GitHub repo: ${process.env.GITHUB_REPO}`);
    commits = await fetchRealCommits(process.env.GITHUB_REPO);
    prs = await fetchRealPullRequests(process.env.GITHUB_REPO);
    tasks = await fetchRealIssues(process.env.GITHUB_REPO);
    decisions = derivDecisionsFromPRs(prs, commits);
    console.log(`  ✓ ${commits.length} commits, ${prs.length} merged PRs, ${tasks.length} issues, ${decisions.length} derived decisions\n`);
  } else {
    console.log("→ No GITHUB_TOKEN/GITHUB_REPO set — using bundled seed data instead.");
    console.log("  (Set both in backend/.env to pull your real repo history.)\n");
  }

  const dataset = { people, decisions, meetings, commits, prs, tasks, docs };

  if (isNeo4jEnabled()) {
    console.log("→ Syncing graph to Neo4j...");
    await syncGraph(dataset);
    await closeDriver();
    console.log("  ✓ Neo4j graph updated\n");
  } else {
    console.log("→ NEO4J_URI not set — skipping real graph sync (using in-memory graph).\n");
  }

  if (isVectorSearchEnabled()) {
    console.log("→ Embedding documents and indexing into Qdrant (first run downloads the embedding model, ~130MB)...");
    const documents = decisions.map((d) => ({
      id: `decision:${d.id}`,
      type: "decision",
      title: d.title,
      date: d.date,
      author: d.author,
      text: `${d.title}. ${d.summary}`,
      tags: d.tags || [],
    }));
    const count = await indexDocuments(documents);
    console.log(`  ✓ Indexed ${count} documents into Qdrant\n`);
  } else {
    console.log("→ QDRANT_URL not set — skipping real vector indexing (using keyword search fallback).\n");
  }

  // Always write the freshly pulled data back to seed.json so the app's
  // fallback path (no Neo4j/Qdrant configured) also reflects real data.
  const seedPath = path.join(__dirname, "../data/seed.json");
  fs.writeFileSync(seedPath, JSON.stringify(dataset, null, 2));
  console.log("✓ Updated local seed.json with the latest pulled data.");
  console.log("\n🧠 Ingestion complete.");
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
