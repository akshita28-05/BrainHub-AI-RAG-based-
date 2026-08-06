import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("demo@brainhub.ai");
    setPassword("demo1234");
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where your organization's memory left off."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-amber-400 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-amber-400 text-ink-950 font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <button
        onClick={fillDemo}
        className="w-full mt-3 py-2.5 rounded-lg border border-ink-700 text-sm text-teal-400 hover:border-teal-400 transition-colors"
      >
        Use demo account
      </button>

      <p className="text-sm text-parchment/50 mt-6 text-center">
        New here?{" "}
        <Link to="/register" className="text-amber-400 hover:text-amber-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
