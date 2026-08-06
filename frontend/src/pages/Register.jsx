import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up BrainHub AI to start connecting your team's decisions, meetings, and code."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-parchment/50 mb-1.5">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-parchment/50 mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-parchment/50 mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-amber-400 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-amber-400 text-ink-950 font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-parchment/50 mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-amber-400 hover:text-amber-300">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
