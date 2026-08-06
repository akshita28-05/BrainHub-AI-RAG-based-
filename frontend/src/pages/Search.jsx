import { useState } from "react";
import Card from "../components/Card.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import { api } from "../lib/api.js";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [engine, setEngine] = useState(null);

  async function runSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.search(q);
      setResults(data.results);
      setEngine(data.engine);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-parchment">Semantic Search</h1>
        <p className="text-parchment/60 mt-2">
          Search across decisions, meetings, commits, and docs by meaning, not just keywords.
        </p>
      </header>

      <form onSubmit={runSearch} className="flex gap-3 mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. auth, database migration, rollback..."
          className="flex-1 bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-amber-400 outline-none"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-amber-400 text-ink-950 font-medium hover:bg-amber-500 transition-colors"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-parchment/50 text-sm">Searching organizational memory…</p>}

      {!loading && searched && (
        <div className="mb-3 text-xs text-parchment/40 font-mono">
          engine: {engine === "qdrant" ? "Qdrant vector search (real)" : "keyword search (demo fallback)"}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-parchment/50 text-sm">No results found.</p>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center gap-2 mb-1">
              <TypeBadge type={r.type} />
              <span className="text-xs text-parchment/40 font-mono">{r.date}</span>
              {r.author && <span className="text-xs text-parchment/40">· {r.author}</span>}
            </div>
            <h3 className="font-display text-lg text-parchment">{r.title}</h3>
            <p className="text-sm text-parchment/60 mt-1">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
