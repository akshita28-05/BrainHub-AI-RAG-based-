export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-ink-900/70 border border-ink-700 rounded-lg p-5 ${className}`}
    >
      {children}
    </div>
  );
}
