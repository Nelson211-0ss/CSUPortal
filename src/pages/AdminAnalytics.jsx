import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Award, BarChart3, CheckCircle2, Clock3, ShieldOff, Users } from "lucide-react";
import { api } from "../api";
import { Card, PageIntro, Stat } from "../components/ui";

export default function AdminAnalytics() {
  const { notify } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminAnalytics()
      .then(setData)
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-sm text-slate-400">Loading...</div>;
  if (!data) return null;

  const categories = Object.entries(data.membersByCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categories.map(([, count]) => count));

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="Compliance analytics" text="Organization-wide CPD activity, membership and compliance insights." icon={BarChart3} />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat title="Total professionals" value={data.totalMembers} sub={`${data.suspendedMembers} suspended`} icon={Users} tint="purple" />
        <Stat title="CPD submissions" value={data.totalSubmissions} sub={`${data.submissionsByStatus.Pending} pending review`} icon={Clock3} tint="pink" />
        <Stat title="Verified points issued" value={data.totalVerifiedPoints} sub="across all members" icon={Award} tint="blue" />
        <Stat title="Compliance rate" value={`${data.complianceRate}%`} sub={`${data.compliantMembers} of ${data.totalMembers} meeting target`} icon={CheckCircle2} tint="black" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Submissions by status">
          <div className="space-y-3">
            {Object.entries(data.submissionsByStatus).map(([status, count]) => {
              const pct = data.totalSubmissions ? Math.round((count / data.totalSubmissions) * 100) : 0;
              const color = status === "Verified" ? "#2563eb" : status === "Pending" ? "#db2777" : "#0f172a";
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-md bg-slate-100">
                    <div className="h-full rounded-md" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Members by professional category">
          {categories.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">No registered professionals yet.</div>
          ) : (
            <div className="space-y-3">
              {categories.map(([category, count]) => (
                <div key={category}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>{category}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-md bg-slate-100">
                    <div className="h-full rounded-md bg-[#7c3aed]" style={{ width: `${(count / maxCategory) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#f3ebfd] text-[#7c3aed]"><Users size={18} /></div>
            <div>
              <div className="text-xs text-slate-400">Administrators</div>
              <div className="text-lg font-extrabold text-slate-900">{data.totalAdmins}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-900 text-white"><ShieldOff size={18} /></div>
            <div>
              <div className="text-xs text-slate-400">Suspended accounts</div>
              <div className="text-lg font-extrabold text-slate-900">{data.suspendedMembers}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#eaf1fe] text-[#2563eb]"><Award size={18} /></div>
            <div>
              <div className="text-xs text-slate-400">Published materials</div>
              <div className="text-lg font-extrabold text-slate-900">{data.totalMaterials}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
