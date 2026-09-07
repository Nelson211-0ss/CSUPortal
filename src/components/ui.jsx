import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, Clock3, Download, Eye, EyeOff, FileWarning, MoreHorizontal, X } from "lucide-react";

const PREVIEWABLE_EXT = new Set(["pdf", "jpg", "jpeg", "png"]);

export function PreviewModal({ title, previewUrl, downloadUrl, filename, onClose }) {
  const ext = (filename || "").split(".").pop()?.toLowerCase();
  const canPreview = PREVIEWABLE_EXT.has(ext);

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h3 className="min-w-0 truncate text-sm font-extrabold text-slate-900">{title}</h3>
          <div className="flex shrink-0 items-center gap-1">
            <a href={downloadUrl} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Download">
              <Download size={17} />
            </a>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Close">
              <X size={17} />
            </button>
          </div>
        </div>
        <div className="min-h-[300px] flex-1 overflow-auto bg-slate-50">
          {ext === "pdf" ? (
            <iframe title={title} src={previewUrl} className="h-[75vh] w-full" />
          ) : canPreview ? (
            <img src={previewUrl} alt={title} className="mx-auto max-h-[75vh] object-contain" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center text-sm text-slate-400">
              <FileWarning size={28} />
              Preview isn't available for this file type.
              <a href={downloadUrl} className="font-bold text-[#7c3aed]">Download instead</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.02)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ title, value, sub, icon: Icon, trend, tint = "purple" }) {
  const tints = {
    purple: "bg-[#f3ebfd] text-[#7c3aed]",
    blue: "bg-[#eaf1fe] text-[#2563eb]",
    pink: "bg-[#fdeaf3] text-[#db2777]",
    black: "bg-slate-100 text-slate-900",
  };
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400">{title}</div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-400">{sub}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-md ${tints[tint]}`}>
          <Icon size={19} />
        </div>
      </div>
      {trend && <div className="mt-4 text-[10px] font-bold text-[#2563eb]">{trend}</div>}
    </Card>
  );
}

export function MiniMetric({ label, value, suffix }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">
        {value} <span className="text-xs font-semibold text-slate-400">{suffix}</span>
      </div>
    </div>
  );
}

export function QuickAction({ icon: Icon, title, text, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-md p-3 text-left hover:bg-slate-50">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#f3ebfd] text-[#7c3aed]">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-900">{title}</div>
        <div className="mt-0.5 text-[11px] text-slate-400">{text}</div>
      </div>
      <ArrowRight size={15} className="text-slate-300" />
    </button>
  );
}

export function PageIntro({ title, text, icon: Icon, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#f3ebfd] text-[#7c3aed]">
          <Icon size={19} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{text}</p>
      </div>
      {action}
    </div>
  );
}

export function Status({ status }) {
  const styles = {
    Verified: "bg-[#eaf1fe] text-[#2563eb]",
    Pending: "bg-[#fdeaf3] text-[#db2777]",
    Rejected: "bg-slate-900 text-white",
  };
  const icons = { Verified: Check, Pending: Clock3, Rejected: X };
  const Icon = icons[status] || Clock3;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      <Icon size={11} /> {status}
    </span>
  );
}

export function Notice({ text }) {
  return (
    <div className="mt-1 flex gap-2 rounded-md p-2.5 hover:bg-slate-50">
      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#7c3aed]" />
      <div className="text-xs leading-5 text-slate-600">{text}</div>
    </div>
  );
}

export function Toast({ message }) {
  return (
    <div className="fixed bottom-20 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl lg:bottom-5">
      <CheckCircle2 size={18} className="text-[#60a5fa]" />
      {message}
    </div>
  );
}

export function Logo() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-md bg-[#7c3aed] text-white shadow-sm">
      <span className="text-sm font-black">CSU</span>
    </div>
  );
}

export function Field({ label, required, select, icon: Icon, revealable, options = [], className = "", type, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealable ? (show ? "text" : "password") : type;
  const padLeft = Icon ? "pl-10" : "pl-3.5";
  const padRight = revealable ? "pr-10" : "pr-3.5";

  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold text-slate-600">
        {label} {required && <span className="text-[#db2777]">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
        {select ? (
          <select
            {...props}
            className={`w-full rounded-md border border-slate-200 bg-white py-3 text-sm outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#f3ebfd] ${padLeft} pr-3.5`}
          >
            {options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            {...props}
            className={`w-full rounded-md border border-slate-200 bg-white py-3 text-sm outline-none placeholder:text-slate-300 focus:border-[#a78bfa] focus:ring-4 focus:ring-[#f3ebfd] ${padLeft} ${padRight}`}
          />
        )}
        {revealable && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function ActivityTable({ activities, actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
            <th className="px-3 py-3 font-bold">Activity</th>
            <th className="px-3 py-3 font-bold">Category</th>
            <th className="px-3 py-3 font-bold">Date</th>
            <th className="px-3 py-3 font-bold">Points</th>
            <th className="px-3 py-3 font-bold">Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {activities.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">
                No CPD activity yet.
              </td>
            </tr>
          )}
          {activities.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
              <td className="px-3 py-4">
                <div className="font-semibold text-sm text-slate-900">{a.activityTitle}</div>
              </td>
              <td className="px-3 py-4 text-xs text-slate-500">{a.cpdCategory}</td>
              <td className="px-3 py-4 text-xs text-slate-500">{a.activityDate}</td>
              <td className="px-3 py-4 text-sm font-extrabold text-slate-900">{a.pointsClaimed}</td>
              <td className="px-3 py-4">
                <Status status={a.status} />
              </td>
              <td className="px-3 py-4 text-right">{actions ? actions(a) : <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={17} /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-white">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
        Loading...
      </div>
    </div>
  );
}
