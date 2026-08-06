const STYLES = {
  decision: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  meeting: "bg-teal-400/15 text-teal-400 border-teal-400/30",
  commit: "bg-parchment/10 text-parchment/70 border-parchment/20",
  document: "bg-rose-400/15 text-rose-400 border-rose-400/30",
  pr: "bg-teal-400/15 text-teal-400 border-teal-400/30",
  task: "bg-parchment/10 text-parchment/70 border-parchment/20",
};

export default function TypeBadge({ type }) {
  const style = STYLES[type] || STYLES.task;
  return (
    <span className={`inline-block text-[11px] uppercase tracking-wide font-mono px-2 py-0.5 rounded border ${style}`}>
      {type}
    </span>
  );
}
