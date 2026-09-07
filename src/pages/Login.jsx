import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, Logo } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin" : location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8f7fb] px-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#7c3aed]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#db2777]/10 blur-3xl" />

      <div className="relative w-full max-w-sm py-8">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-xs text-slate-500">Log in to your CSU Professional Portal account</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {error && (
            <div className="rounded-md bg-[#fdeaf3] px-4 py-3 text-sm font-semibold text-[#db2777]">{error}</div>
          )}

          <Field
            label="Email address"
            required
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            required
            type="password"
            icon={Lock}
            revealable
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="my-5 border-t border-slate-100" />

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-[#7c3aed]">
            Create one
          </Link>
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="shrink-0 text-slate-400" />
          Admin demo login: admin@csu.ug / Admin@123
        </div>
      </div>
    </div>
  );
}
