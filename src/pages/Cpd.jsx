import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Award, Download, GraduationCap } from "lucide-react";
import { api } from "../api";
import { Card, MiniMetric, PageIntro, ActivityTable } from "../components/ui";

export default function Cpd() {
  const { notify } = useOutletContext();
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listCpd()
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? submissions : submissions.filter((a) => a.status === filter);
  const totalClaimed = submissions.reduce((sum, s) => sum + Number(s.pointsClaimed || 0), 0);
  const verifiedPoints = submissions.filter((s) => s.status === "Verified").reduce((sum, s) => sum + Number(s.pointsClaimed || 0), 0);
  const remaining = Math.max(0, 30 - verifiedPoints);

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="My CPD record" text="A transparent record of your submitted and verified continuing professional development activities." icon={Award} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <MiniMetric label="Total claimed" value={totalClaimed} suffix="points" />
        <MiniMetric label="Verified" value={verifiedPoints} suffix="points" />
        <MiniMetric label="Remaining target" value={remaining} suffix="points" />
      </div>
      <Card
        title="Activity history"
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none">
            <option>All</option>
            <option>Verified</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
        ) : (
          <ActivityTable
            activities={filtered}
            actions={(a) => (
              <div className="flex items-center justify-end gap-1">
                {a.evidenceFile && (
                  <a href={api.evidenceUrl(a.id)} title="Download evidence" className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-[#7c3aed] hover:bg-[#f3ebfd]">
                    <Download size={14} />
                  </a>
                )}
                {a.status === "Verified" && (
                  <a
                    href={api.certificateUrl(a.id)}
                    target="_blank"
                    rel="noreferrer"
                    title="Download certificate"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-[#2563eb] hover:bg-[#eaf1fe]"
                  >
                    <GraduationCap size={14} />
                  </a>
                )}
                {!a.evidenceFile && a.status !== "Verified" && <span className="text-xs text-slate-300">—</span>}
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
}
