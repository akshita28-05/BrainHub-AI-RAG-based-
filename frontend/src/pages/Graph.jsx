import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import { api } from "../lib/api.js";

const TYPE_COLOR = {
  person: "#3FA9A0",
  decision: "#E8A33D",
  meeting: "#8FD8D1",
  commit: "#B7BEC9",
  pr: "#6FC2BA",
  task: "#8A93A0",
  document: "#C15B4A",
};

const RING_ORDER = ["decision", "person", "meeting", "commit", "pr", "task", "document"];

function layout(nodes, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const byType = {};
  nodes.forEach((n) => {
    byType[n.type] = byType[n.type] || [];
    byType[n.type].push(n);
  });

  const positioned = {};
  RING_ORDER.forEach((type, ringIndex) => {
    const group = byType[type] || [];
    const radius = 90 + ringIndex * 85;
    group.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(group.length, 1) + ringIndex * 0.3;
      positioned[n.id] = {
        ...n,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  });
  return positioned;
}

export default function Graph() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [hovered, setHovered] = useState(null);
  const width = 900;
  const height = 700;

  useEffect(() => {
    api.graph().then(setGraph);
  }, []);

  const positioned = useMemo(() => layout(graph.nodes, width, height), [graph]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-parchment">Knowledge Graph</h1>
        <p className="text-parchment/60 mt-2">
          Decisions at the center, radiating out to the people, meetings, commits, PRs, tasks, and docs that surround them.
        </p>
      </header>

      <div className="flex gap-3 mb-4 flex-wrap">
        {Object.entries(TYPE_COLOR).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-parchment/60">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {type}
          </div>
        ))}
      </div>

      <Card className="overflow-auto">
        <svg width={width} height={height}>
          {graph.edges.map((e, i) => {
            const s = positioned[e.source];
            const t = positioned[e.target];
            if (!s || !t) return null;
            const dim = hovered && hovered !== e.source && hovered !== e.target;
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={dim ? "#262B34" : "#3FA9A0"}
                strokeOpacity={dim ? 0.3 : 0.35}
                strokeWidth={1}
              />
            );
          })}
          {Object.values(positioned).map((n) => (
            <g
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={n.type === "decision" ? 9 : 6}
                fill={TYPE_COLOR[n.type] || "#888"}
                opacity={hovered && hovered !== n.id ? 0.3 : 1}
              />
              {(hovered === n.id || n.type === "decision") && (
                <text
                  x={n.x + 12}
                  y={n.y + 4}
                  fontSize="11"
                  fill="#F3EFE6"
                  opacity={hovered && hovered !== n.id ? 0.3 : 0.85}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {n.label.length > 40 ? n.label.slice(0, 40) + "…" : n.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </Card>
    </div>
  );
}
