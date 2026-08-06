import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import { api } from "../lib/api.js";

export default function Timeline() {
  const [timeline, setTimeline] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.timeline().then((d) => setTimeline(d.timeline));
  }, []);

  async function toggle(id) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    const d = await api.decision(id);
    setDetail(d);
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-parchment">Decision Timeline</h1>
        <p className="text-parchment/60 mt-2">
          Every architectural and product decision, in the order it happened.
        </p>
      </header>

      <div className="memory-thread pl-10 space-y-6">
        {timeline.map((d) => (
          <div key={d.id} className="relative">
            <div className="absolute -left-[34px] top-4 w-3 h-3 rounded-full bg-amber-400 node-dot" />
            <Card className="cursor-pointer" >
              <div onClick={() => toggle(d.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <TypeBadge type="decision" />
                  <span className="text-xs text-parchment/40 font-mono">{d.date}</span>
                </div>
                <h3 className="font-display text-lg text-parchment">{d.title}</h3>
                <p className="text-sm text-parchment/60 mt-1">{d.summary}</p>
              </div>

              {expanded === d.id && detail && (
                <div className="mt-4 pt-4 border-t border-ink-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-parchment/40 font-mono uppercase mb-2">Impact</div>
                    <p className="text-sm text-parchment/70">{detail.decision.impact}</p>
                  </div>
                  <div className="space-y-3">
                    <ArtifactGroup label="Meetings" items={detail.meetings.map((m) => m.title)} type="meeting" />
                    <ArtifactGroup label="Commits" items={detail.commits.map((c) => c.message)} type="commit" />
                    <ArtifactGroup label="Pull Requests" items={detail.prs.map((p) => p.title)} type="pr" />
                    <ArtifactGroup label="Docs" items={detail.docs.map((doc) => doc.title)} type="document" />
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactGroup({ label, items, type }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <TypeBadge type={type} />
        <span className="text-xs text-parchment/40">{label}</span>
      </div>
      <ul className="text-sm text-parchment/70 space-y-0.5 ml-1">
        {items.map((it, i) => (
          <li key={i}>· {it}</li>
        ))}
      </ul>
    </div>
  );
}
