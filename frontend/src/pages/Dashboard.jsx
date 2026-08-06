import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [timeline, setTimeline] = useState([]);
  const [risk, setRisk] = useState(null);
  const [graph, setGraph] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.timeline(), api.risk(), api.graph(), api.meta()])
      .then(([t, r, g, m]) => {
        setTimeline(t.timeline);
        setRisk(r);
        setGraph(g);
        setMeta(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card className="border-rose-400/40">
        <p className="text-rose-400 text-sm">
          Couldn't reach the BrainHub AI backend — is it running on port 4000? ({error})
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-3xl text-parchment">Organizational Memory, at a glance</h1>
          {meta && (
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                meta.dataset === "kaggle-enron"
                  ? "text-teal-400 border-teal-400/40 bg-teal-400/10"
                  : "text-amber-400 border-amber-400/40 bg-amber-400/10"
              }`}
            >
              {meta.datasetLabel}
            </span>
          )}
        </div>
        <p className="text-parchment/60 mt-2 max-w-2xl">
          Every decision your team makes, connected to the meeting that shaped it,
          the commit that shipped it, and the person who owns it.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <div className="text-parchment/50 text-xs font-mono uppercase tracking-wide">Decisions tracked</div>
          <div className="font-display text-4xl text-amber-400 mt-2">{timeline.length}</div>
        </Card>
        <Card>
          <div className="text-parchment/50 text-xs font-mono uppercase tracking-wide">Graph nodes</div>
          <div className="font-display text-4xl text-teal-400 mt-2">{graph?.nodes.length ?? "—"}</div>
        </Card>
        <Card>
          <div className="text-parchment/50 text-xs font-mono uppercase tracking-wide">Org knowledge risk</div>
          <div className="font-display text-4xl text-rose-400 mt-2">{risk ? `${risk.orgAverage}%` : "—"}</div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-parchment">Recent decisions</h2>
          <Link to="/timeline" className="text-sm text-teal-400 hover:text-teal-300">
            View full timeline →
          </Link>
        </div>
        <div className="space-y-3">
          {timeline.slice(0, 4).map((d) => (
            <Card key={d.id} className="hover:border-amber-400/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type="decision" />
                    <span className="text-xs text-parchment/40 font-mono">{d.date}</span>
                  </div>
                  <h3 className="font-display text-lg text-parchment">{d.title}</h3>
                  <p className="text-sm text-parchment/60 mt-1">{d.summary}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
