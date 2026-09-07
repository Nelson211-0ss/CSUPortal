import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, ClipboardCheck, Download, X } from "lucide-react";
import { api } from "../api";
import { Card, MiniMetric, PageIntro, Status } from "../components/ui";

export default function Admin() {
  const { notify } = useOutletContext();
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .adminListCpd()
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (id, status) => {
    setBusyId(id);
    try {
      await api.verifyCpd(id, { status });
      notify(`Submission marked as ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === "All" ? submissions : submissions.filter((s) => s.status === filter);
  const pendingCount = submissions.filter((s) => s.status === "Pending").length;
  const verifiedCount = submissions.filter((s) => s.status === "Verified").length;
  const rejectedCount = submissions.filter((s) => s.status === "Rejected").length;

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="CPD verification" text="Review submitted CPD evidence from CSU professionals and verify or reject each activity." icon={ClipboardCheck} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <MiniMetric label="Pending review" value={pendingCount} suffix="submissions" />
        <MiniMetric label="Verified" value={verifiedCount} suffix="submissions" />
        <MiniMetric label="Rejected" value={rejectedCount} suffix="submissions" />
      </div>

      <Card
        title="Submissions"
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none">
            <option>Pending</option>
            <option>Verified</option>
            <option>Rejected</option>
            <option>All</option>
          </select>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No submissions in this category.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900">{s.activityTitle}</h3>
                      <Status status={s.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {s.name} · {s.email} · {s.professionalCategory}
                    </p>
                  </div>
                  {s.evidenceFile && (
                    <a href={api.evidenceUrl(s.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#7c3aed] hover:bg-[#f3ebfd]">
                      <Download size={14} /> Evidence
                    </a>
                  )}
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                  <div><b className="text-slate-700">Category:</b> {s.cpdCategory}</div>
                  <div><b className="text-slate-700">Date:</b> {s.activityDate}</div>
                  <div><b className="text-slate-700">Points claimed:</b> {s.pointsClaimed}</div>
                  <div><b className="text-slate-700">Licence:</b> {s.licenceNumber || "—"}</div>
                  <div><b className="text-slate-700">Institution:</b> {s.institution || "—"}</div>
                  <div><b className="text-slate-700">Phone:</b> {s.phone || "—"}</div>
                </div>
                {s.notes && <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">{s.notes}</p>}
                {s.status === "Pending" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => act(s.id, "Verified")}
                      disabled={busyId === s.id}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "#2563eb" }}
                    >
                      <Check size={14} /> Verify
                    </button>
                    <button
                      onClick={() => act(s.id, "Rejected")}
                      disabled={busyId === s.id}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
