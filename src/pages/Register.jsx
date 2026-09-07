import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, Building2, IdCard, Lock, Mail, Phone, Stethoscope, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, Logo } from "../components/ui";

const CATEGORIES = ["Cytotechnologist", "Laboratory Technologist", "Pathologist", "Medical Officer", "Nurse", "Student", "Dentist", "Other"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", professionalCategory: CATEGORIES[0],
    licenceNumber: "", phone: "", institution: "", designation: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8f7fb] px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#7c3aed]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#db2777]/10 blur-3xl" />

      <div className="relative w-full max-w-2xl py-8">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Create your professional account</h1>
          <p className="mt-1 text-sm text-slate-500">Join the CSU Professional Portal to track and submit your CPD</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md bg-[#fdeaf3] px-4 py-3 text-sm font-semibold text-[#db2777]">{error}</div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" required icon={User} value={form.name} onChange={set("name")} />
            <Field label="Email address" required type="email" icon={Mail} value={form.email} onChange={set("email")} />
            <Field label="Password" required type="password" icon={Lock} revealable minLength={6} value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
            <Field label="Professional category" required select icon={Stethoscope} options={CATEGORIES} value={form.professionalCategory} onChange={set("professionalCategory")} />
            <Field label="Licence number" icon={IdCard} value={form.licenceNumber} onChange={set("licenceNumber")} placeholder="e.g. UMC-000123" />
            <Field label="Phone number" type="tel" icon={Phone} value={form.phone} onChange={set("phone")} placeholder="+256..." />
            <Field label="Institution" icon={Building2} value={form.institution} onChange={set("institution")} placeholder="Institution / facility" />
            <Field label="Designation" icon={Briefcase} value={form.designation} onChange={set("designation")} placeholder="Job title / role" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="my-6 border-t border-slate-100" />

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#7c3aed]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
