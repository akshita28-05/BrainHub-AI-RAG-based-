export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex">
      {/* Branding panel — hidden on small screens, shown from md up (PC-friendly) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative flex-col justify-between p-12 border-r border-ink-700 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(63,169,160,0.14), transparent 45%), radial-gradient(circle at 80% 80%, rgba(232,163,61,0.10), transparent 50%)",
          }}
        />
        <div className="font-display text-3xl text-parchment">
          Brain<span className="text-amber-400">Hub</span>{" "}
          <span className="text-teal-400 text-xl align-top">AI</span>
        </div>

        <div className="max-w-md">
          <div className="memory-thread pl-8 space-y-5">
            {[
              { label: "Meeting", text: "Team agrees to switch the checkout service to PostgreSQL." },
              { label: "Decision", text: "Migrate off MySQL — logged with full rationale and owner." },
              { label: "Commit", text: "feat: postgres migration — shipped two weeks later." },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 node-dot" />
                <div className="text-[11px] font-mono uppercase tracking-wide text-teal-400">
                  {step.label}
                </div>
                <div className="text-parchment/80 text-sm mt-0.5">{step.text}</div>
              </div>
            ))}
          </div>
          <p className="text-parchment/50 text-sm mt-8 leading-relaxed">
            BrainHub AI threads every decision your team makes to the meeting that
            shaped it, the commit that shipped it, and the person who owns it —
            so nobody has to ask "wait, why did we do this?" in a meeting again.
          </p>
        </div>

        <div className="text-xs text-parchment/30 font-mono">v1.0 · organizational memory engine</div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="md:hidden font-display text-2xl text-parchment mb-8 text-center">
            Brain<span className="text-amber-400">Hub</span>{" "}
            <span className="text-teal-400 text-lg align-top">AI</span>
          </div>
          <h1 className="font-display text-2xl text-parchment">{title}</h1>
          {subtitle && <p className="text-parchment/60 text-sm mt-2 mb-8">{subtitle}</p>}
          {!subtitle && <div className="mb-8" />}
          {children}
        </div>
      </div>
    </div>
  );
}
