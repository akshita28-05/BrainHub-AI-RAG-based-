import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "◆" },
  { to: "/timeline", label: "Decision Timeline", icon: "◷" },
  { to: "/search", label: "Semantic Search", icon: "◎" },
  { to: "/chat", label: "Ask BrainHub AI", icon: "◈" },
  { to: "/graph", label: "Knowledge Graph", icon: "◫" },
  { to: "/risk", label: "Knowledge Risk", icon: "◭" },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-ink-700 bg-ink-900 lg:bg-ink-900/60 backdrop-blur-sm flex flex-col transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="px-6 py-7 border-b border-ink-700 flex items-center justify-between">
          <div>
            <div className="font-display text-2xl tracking-tight text-parchment">
              Brain<span className="text-amber-400">Hub</span>{" "}
              <span className="text-teal-400 text-lg align-top">AI</span>
            </div>
            <div className="text-xs text-parchment/50 mt-1 font-mono">
              organizational memory engine
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-parchment/50 hover:text-parchment hover:bg-ink-800 transition-colors"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-2 ${
                  isActive
                    ? "border-amber-400 bg-ink-800 text-amber-400"
                    : "border-transparent text-parchment/70 hover:text-parchment hover:bg-ink-800/60"
                }`
              }
            >
              <span className="text-teal-400">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-ink-700 text-xs text-parchment/40 font-mono">
          v1.0 · demo data
        </div>
      </aside>
    </>
  );
}
