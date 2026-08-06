import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import { api } from "../lib/api.js";

const LEVEL_STYLE = {
  high: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-teal-400 bg-teal-400/10 border-teal-400/30",
};

export default function Risk() {
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    api.risk().then(setRisk);
  }, []);

  if (!risk) return <p className="text-parchment/50">Loading…</p>;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-parchment">Knowledge Risk Score</h1>
        <p className="text-parchment/60 mt-2 max-w-2xl">
          How much critical knowledge sits with just one person. Higher scores mean
          more "bus factor" risk — if they left tomorrow, that context would leave with them.
        </p>
      </header>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-parchment/50 font-mono uppercase tracking-wide">Org-wide average</div>
            <div className="font-display text-5xl text-rose-400 mt-1">{risk.orgAverage}%</div>
          </div>
          <div className="text-right text-sm text-parchment/50 max-w-xs">
            Based on {risk.graphSize} connected artifacts across decisions, commits, and tasks.
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {risk.people.map((p) => (
          <Card key={p.personId}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-lg text-parchment">{p.name}</div>
                <div className="text-sm text-parchment/50">{p.role}</div>
                <div className="text-xs text-parchment/40 mt-1">
                  {p.soloArtifacts} of {p.totalArtifacts} artifacts solely owned
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full border text-sm font-mono ${LEVEL_STYLE[p.riskLevel]}`}>
                  {p.riskScore}% · {p.riskLevel}
                </span>
              </div>
            </div>
            <div className="w-full bg-ink-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  p.riskLevel === "high" ? "bg-rose-400" : p.riskLevel === "medium" ? "bg-amber-400" : "bg-teal-400"
                }`}
                style={{ width: `${p.riskScore}%` }}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
