import { db, graph } from "./memoryStore.js";

/**
 * Knowledge Risk Score: a simple, explainable heuristic.
 *
 * For each person, we look at how many decisions/commits/docs they are the
 * SOLE author or owner of. The more unique knowledge concentrated in one
 * person with no co-owners, the higher their "bus factor" risk.
 *
 * score = (solo-owned artifacts) / (total artifacts touched) * 100
 */
export function computeRiskScores() {
  const personStats = {};

  for (const p of db.people) {
    personStats[p.id] = { person: p, totalArtifacts: 0, soloArtifacts: 0 };
  }

  const countOwnership = (ownerIds, weightSolo = true) => {
    if (ownerIds.length === 0) return;
    ownerIds.forEach((id) => {
      if (!personStats[id]) return;
      personStats[id].totalArtifacts += 1;
      if (weightSolo && ownerIds.length === 1) personStats[id].soloArtifacts += 1;
    });
  };

  db.decisions.forEach((d) => countOwnership([d.author]));
  db.commits.forEach((c) => countOwnership([c.author]));
  db.tasks.forEach((t) => countOwnership([t.assignee]));

  const results = Object.values(personStats)
    .filter((s) => s.totalArtifacts > 0)
    .map((s) => {
      const riskScore = Math.round((s.soloArtifacts / s.totalArtifacts) * 100);
      return {
        personId: s.person.id,
        name: s.person.name,
        role: s.person.role,
        totalArtifacts: s.totalArtifacts,
        soloArtifacts: s.soloArtifacts,
        riskScore,
        riskLevel: riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const orgAverage = Math.round(
    results.reduce((sum, r) => sum + r.riskScore, 0) / (results.length || 1)
  );

  return { people: results, orgAverage, graphSize: graph.nodes.length };
}
