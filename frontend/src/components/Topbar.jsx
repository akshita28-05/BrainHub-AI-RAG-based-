import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 border-b border-ink-700 bg-ink-950/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-parchment/70 hover:text-parchment hover:bg-ink-800 transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="lg:hidden font-display text-lg text-parchment">
          Brain<span className="text-amber-400">Hub</span>
        </div>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-ink-800 transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-teal-400/15 border border-teal-400/40 text-teal-400 text-xs font-mono flex items-center justify-center shrink-0">
            {initials(user?.name) || "?"}
          </span>
          <span className="hidden sm:block text-sm text-parchment/80 max-w-[10rem] truncate">
            {user?.name}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-ink-700 bg-ink-900 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-700">
              <div className="text-sm text-parchment truncate">{user?.name}</div>
              <div className="text-xs text-parchment/40 truncate mt-0.5">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-ink-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
