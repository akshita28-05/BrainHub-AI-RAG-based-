import { useRef, useState } from "react";
import Card from "../components/Card.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import { api } from "../lib/api.js";

const SUGGESTIONS = [
  "Why did we switch to PostgreSQL?",
  "Who owns the auth system?",
  "Why was the reporting API deprecated?",
  "What caused the checkout outage?",
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  async function send(question) {
    const q = question ?? input;
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.chat(q);
      setMessages((m) => [...m, { role: "assistant", text: data.answer, sources: data.sources, usedLLM: data.usedLLM }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex flex-col h-[75vh] sm:h-[78vh]">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-parchment">Ask BrainHub AI</h1>
        <p className="text-parchment/60 mt-2">
          Ask why a decision was made, who made it, and what it changed.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-sm px-3 py-2 rounded-lg border border-ink-700 text-parchment/70 hover:border-teal-400 hover:text-teal-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[75%] ${m.role === "user" ? "bg-amber-400 text-ink-950" : ""}`}>
              {m.role === "user" ? (
                <div className="rounded-lg px-4 py-3">{m.text}</div>
              ) : (
                <Card>
                  <p className="text-sm text-parchment/90 whitespace-pre-wrap">{m.text}</p>
                  {m.sources?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-ink-700 flex flex-wrap gap-2">
                      {m.sources.map((s) => (
                        <span key={s.id} className="flex items-center gap-1">
                          <TypeBadge type={s.type} />
                          <span className="text-xs text-parchment/40">{s.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {!m.usedLLM && (
                    <div className="mt-2 text-[11px] text-parchment/30 font-mono">
                      answered from retrieved context · add GROQ_API_KEY for LLM-generated answers
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-parchment/40 text-sm">BrainHub AI is thinking…</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-3 mt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask why a decision was made…"
          className="flex-1 bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-amber-400 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-amber-400 text-ink-950 font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
