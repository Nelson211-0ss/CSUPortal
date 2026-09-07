import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Check, CheckCircle2, FileText, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Field, PageIntro } from "../components/ui";

const CATEGORIES = ["Cytotechnologist", "Laboratory Technologist", "Pathologist", "Medical Officer", "Nurse", "Student", "Dentist", "Other"];
const CPD_CATEGORIES = ["Publication", "Presenter", "Participant", "Workshop / Training", "Conference", "Committee / Voluntary Work"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function UploadActivity() {
  const { notify } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    professionalCategory: user?.professionalCategory || CATEGORIES[0],
    licenceNumber: user?.licenceNumber || "",
    phone: user?.phone || "",
    institution: user?.institution || "",
    designation: user?.designation || "",
    activityTitle: "",
    activityDate: "",
    cpdCategory: CPD_CATEGORIES[2],
    pointsClaimed: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFileError("");
    if (f && f.size > MAX_SIZE) {
      setFileError("File is larger than 10 MB.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("evidence", file);
      await api.submitCpd(fd);
      setSubmitted(true);
      notify("CPD activity submitted for verification.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForNext = () => {
    setSubmitted(false);
    setFile(null);
    setForm((f) => ({ ...f, activityTitle: "", activityDate: "", pointsClaimed: "", notes: "" }));
  };

  if (submitted) {
    return (
      <div className="fade-up mx-auto max-w-2xl py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-[#eaf1fe] text-[#2563eb]">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">Activity submitted</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your CPD activity has been received and is now awaiting CSU verification. You can track its status from
            your CPD record.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={resetForNext} className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-bold">
              Submit another
            </button>
            <button onClick={() => navigate("/cpd")} className="rounded-md bg-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6d28d9]">
              View CPD record
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="Upload CPD activity" text="Submit your professional development activity and supporting evidence for review." icon={Upload} />
      {error && <div className="rounded-md bg-[#fdeaf3] px-4 py-3 text-sm font-semibold text-[#db2777]">{error}</div>}
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Professional & activity details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" required value={form.name} onChange={set("name")} />
            <Field label="Email address" required type="email" value={form.email} onChange={set("email")} />
            <Field label="Professional category" required select options={CATEGORIES} value={form.professionalCategory} onChange={set("professionalCategory")} />
            <Field label="Licence number" value={form.licenceNumber} onChange={set("licenceNumber")} placeholder="e.g. UMC-000123" />
            <Field label="Phone number" required type="tel" value={form.phone} onChange={set("phone")} placeholder="+256..." />
            <Field label="Institution" value={form.institution} onChange={set("institution")} placeholder="Institution / facility" />
            <Field label="Designation" value={form.designation} onChange={set("designation")} placeholder="Job title / role" />
            <Field label="Session / activity title" required value={form.activityTitle} onChange={set("activityTitle")} placeholder="Enter the activity title" />
            <Field label="Date of activity" required type="date" value={form.activityDate} onChange={set("activityDate")} />
            <Field label="CPD category" required select options={CPD_CATEGORIES} value={form.cpdCategory} onChange={set("cpdCategory")} />
            <Field label="CPD points claimed" required type="number" min="0" step="0.5" value={form.pointsClaimed} onChange={set("pointsClaimed")} placeholder="e.g. 5" />
          </div>
          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold text-slate-600">Additional notes</label>
            <textarea
              rows="4"
              value={form.notes}
              onChange={set("notes")}
              className="w-full resize-none rounded-md border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#f3ebfd]"
              placeholder="Add any relevant information..."
            />
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Proof of activity">
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-[#c9b3f5] bg-[#faf7ff] p-6 text-center hover:bg-[#f3ebfd]">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFileChange} />
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-white text-[#7c3aed] shadow-sm">
                <Upload size={22} />
              </div>
              <div className="mt-3 text-sm font-bold">{file ? file.name : "Upload certificate or proof"}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">PDF, JPG or PNG · Max 10 MB</div>
            </label>
            {fileError && <div className="mt-2 text-xs font-semibold text-[#db2777]">{fileError}</div>}
            {file && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 p-3 text-xs">
                <FileText size={16} className="text-[#7c3aed]" />
                <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
                <Check size={15} className="text-[#2563eb]" />
              </div>
            )}
          </Card>
          <div className="rounded-lg border border-[#f3d9ea] bg-[#fdf2f8] p-4 text-xs leading-5 text-[#9d174d]">
            <b>Before submitting:</b> Make sure your name, activity date, claimed points, and supporting evidence are
            accurate.
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit for verification"}
          </button>
        </div>
      </form>
    </div>
  );
}
