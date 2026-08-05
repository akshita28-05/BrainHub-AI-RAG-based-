import neo4j from "neo4j-driver";

/**
 * Real Neo4j-backed graph service.
 * Active only when NEO4J_URI (and credentials) are set in .env.
 * Falls back to the in-memory graph in memoryStore.js otherwise.
 */

let driver = null;

export function isNeo4jEnabled() {
  return Boolean(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD);
}

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD)
    );
  }
  return driver;
}

/** Wipes and rewrites the graph from scratch. Used by the ingestion script. */
export async function syncGraph({ people, decisions, meetings, commits, prs, tasks, docs }) {
  const session = getDriver().session();
  try {
    await session.run("MATCH (n) DETACH DELETE n");

    for (const p of people) {
      await session.run(
        "CREATE (:Person {id: $id, name: $name, role: $role})",
        p
      );
    }
    for (const d of decisions) {
      await session.run(
        "CREATE (:Decision {id: $id, title: $title, date: $date, summary: $summary, impact: $impact})",
        { id: d.id, title: d.title, date: d.date, summary: d.summary, impact: d.impact }
      );
      await session.run(
        `MATCH (p:Person {id: $authorId}), (d:Decision {id: $decisionId})
         CREATE (p)-[:MADE]->(d)`,
        { authorId: d.author, decisionId: d.id }
      );
    }
    for (const m of meetings) {
      await session.run("CREATE (:Meeting {id: $id, title: $title, date: $date, notes: $notes})", m);
    }
    for (const c of commits) {
      await session.run("CREATE (:Commit {id: $id, hash: $hash, message: $message, date: $date})", c);
    }
    for (const pr of prs) {
      await session.run("CREATE (:PR {id: $id, title: $title, date: $date, status: $status})", pr);
    }
    for (const t of tasks) {
      await session.run("CREATE (:Task {id: $id, title: $title, status: $status})", t);
    }
    for (const doc of docs) {
      await session.run("CREATE (:Document {id: $id, title: $title, date: $date})", doc);
    }

    // Link decisions to their artifacts
    for (const d of decisions) {
      const linkTypes = [
        ["meetings", "Meeting", "DISCUSSED_IN"],
        ["commits", "Commit", "IMPLEMENTED_BY"],
        ["prs", "PR", "SHIPPED_IN"],
        ["tasks", "Task", "TRACKED_AS"],
        ["docs", "Document", "DOCUMENTED_IN"],
      ];
      for (const [key, label, rel] of linkTypes) {
        for (const targetId of d.linked[key] || []) {
          await session.run(
            `MATCH (d:Decision {id: $decisionId}), (x:${label} {id: $targetId})
             CREATE (d)-[:${rel}]->(x)`,
            { decisionId: d.id, targetId }
          );
        }
      }
    }
  } finally {
    await session.close();
  }
}

/** Returns the whole graph as { nodes, edges } — same shape as the demo version. */
export async function fetchGraph() {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (n)
       OPTIONAL MATCH (n)-[r]->(m)
       RETURN n, r, m`
    );

    const nodeMap = new Map();
    const edges = [];

    const toNode = (node) => {
      const props = node.properties;
      const type = node.labels[0].toLowerCase();
      const idKey = `${type}:${props.id}`;
      if (!nodeMap.has(idKey)) {
        nodeMap.set(idKey, {
          id: idKey,
          label: props.title || props.name || props.hash || props.id,
          type,
          date: props.date,
        });
      }
      return idKey;
    };

    result.records.forEach((record) => {
      const n = record.get("n");
      const m = record.get("m");
      const r = record.get("r");
      const sourceId = toNode(n);
      if (m && r) {
        const targetId = toNode(m);
        edges.push({ source: sourceId, target: targetId, type: r.type });
      }
    });

    return { nodes: [...nodeMap.values()], edges };
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  if (driver) await driver.close();
}
