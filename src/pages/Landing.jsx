import { Link } from "react-router-dom";
import {
  ArrowRight, Award, BookOpen, CalendarDays, HeartPulse, ShieldCheck, Target, Users,
} from "lucide-react";
import { Logo } from "../components/ui";

const OBJECTIVES = [
  "Advance professional development and continuous learning.",
  "Promote quality and evidence-based cytology practice.",
  "Strengthen cytology education, training and mentorship.",
  "Promote research, innovation and knowledge generation.",
  "Advance cancer screening and early disease detection.",
  "Advocate for the recognition and advancement of the cytology profession.",
  "Build national, regional and international partnerships.",
  "Improve access to quality cytology services in Uganda.",
  "Promote public and professional awareness of cytology.",
  "Uphold professional ethics, leadership and patient-centered care.",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Logo />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-extrabold tracking-tight text-[#5b21b6] sm:text-sm">
              <span className="sm:hidden">CSU Portal</span>
              <span className="hidden sm:inline">Cytology Society of Uganda</span>
            </div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400 sm:block">
              Professional Portal
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to="/login"
              className="whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="whitespace-nowrap rounded-md bg-[#7c3aed] px-2.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#6d28d9] sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0b0b12] text-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#2563eb]/30 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-[#7c3aed]/30 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-[#db2777]/25 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              A professional home for cytology practice in Uganda
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
              Track CPD, verify evidence, and discover training — all in one place.
            </p>
            <div className="mx-auto mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#6d28d9] hover:shadow-md"
              >
                Get started <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-center text-sm font-bold transition hover:bg-white/15"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-8">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#eaf1fe] text-[#2563eb]">
              <Target size={20} />
            </div>
            <h2 className="text-xl font-extrabold">Our Vision</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              To be a leading professional society advancing excellence, innovation and global standards in cytology
              for improved health outcomes in Uganda and beyond.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-8">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#fdeaf3] text-[#db2777]">
              <HeartPulse size={20} />
            </div>
            <h2 className="text-xl font-extrabold">Our Mission</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              To promote excellence in cytology practice, education, research and professional development through
              continuous learning, collaboration, advocacy and quality improvement, contributing to early disease
              detection and improved patient care.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f7fb] py-10 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="mb-6 max-w-2xl sm:mb-10">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#f3ebfd] text-[#7c3aed]">
              <ShieldCheck size={19} />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Strategic Objectives</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ten commitments guiding how CSU serves its members and the public.
            </p>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {OBJECTIVES.map((text, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0b0b12] text-xs font-extrabold text-white">
                  {i + 1}
                </div>
                <p className="text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-10 pb-8 sm:px-6 sm:py-16">
        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          <FeatureCard icon={Award} tint="purple" title="Track your CPD" text="Log points, upload evidence and see verification status in real time." />
          <FeatureCard icon={CalendarDays} tint="blue" title="Discover training" text="Browse workshops, conferences and professional learning opportunities." />
          <FeatureCard icon={Users} tint="pink" title="Stay verified" text="CSU reviews submitted evidence so your professional record stays credible." />
        </div>
      </section>

      <footer className="bg-[#db2777] py-8 sm:py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="text-xs leading-tight text-pink-100">
              <div className="font-bold text-white">Cytology Society of Uganda</div>
              © {new Date().getFullYear()} All rights reserved.
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs font-semibold text-pink-50">
            <Link to="/login" className="hover:text-white">Log in</Link>
            <Link to="/register" className="hover:text-white">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text, tint }) {
  const tints = {
    purple: "bg-[#f3ebfd] text-[#7c3aed]",
    blue: "bg-[#eaf1fe] text-[#2563eb]",
    pink: "bg-[#fdeaf3] text-[#db2777]",
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md ${tints[tint]}`}>
        <Icon size={20} />
      </div>
      <h3 className="font-extrabold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
