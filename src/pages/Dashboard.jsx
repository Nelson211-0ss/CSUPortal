import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CalendarDays, Clock3, FileCheck2, Sparkles, Upload, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Stat, QuickAction, ActivityTable } from "../components/ui";
import heroProfessional from "../assets/hero-professional.jpg";

const ANNUAL_TARGET = 30;
const PROFILE_FIELDS = ["professionalCategory", "licenceNumber", "phone", "institution", "designation"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { notify } = useOutletContext();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listCpd()
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const verified = submissions.filter((s) => s.status === "Verified");
    const pending = submissions.filter((s) => s.status === "Pending");
    const totalPoints = verified.reduce((sum, s) => sum + Number(s.pointsClaimed || 0), 0);
    const filled = PROFILE_FIELDS.filter((f) => user?.[f]).length;
    const profileCompletion = Math.round((filled / PROFILE_FIELDS.length) * 100);
    const progressPct = Math.min(100, Math.round((totalPoints / ANNUAL_TARGET) * 100));
    return { verified, pending, totalPoints, profileCompletion, progressPct };
  }, [submissions, user]);

  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <div className="fade-up space-y-6">
      <section className="relative overflow-hidden rounded-lg text-white shadow-sm" style={{ background: "#2e1065" }}>
        <div className="absolute inset-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:aspect-square lg:w-auto">
          <img
            src={heroProfessional}
            alt="CSU medical professional"
            className="h-full w-full object-cover object-[center_18%] lg:object-bottom"
          />
          <div
            className="absolute inset-0 lg:hidden"
            style={{ background: "linear-gradient(180deg, rgba(46,16,101,0.35) 0%, #2e1065 85%)" }}
          />
        </div>
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(46,16,101,1) 0%, rgba(46,16,101,1) 70%, rgba(46,16,101,0.9) 76%, rgba(46,16,101,0.6) 83%, rgba(46,16,101,0.3) 90%, rgba(46,16,101,0) 98%)",
          }}
        />
        <div className="relative max-w-2xl p-6 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <Sparkles size={14} /> Professional development hub
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {firstName}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Track your CPD, submit evidence, discover professional learning opportunities, and keep your CSU profile
            current.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/upload")}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-bold text-[#111827] shadow-sm hover:bg-slate-100"
            >
              Upload CPD <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate("/cpd")} className="rounded-md border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15">
              View my record
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat title="CPD points" value={stats.totalPoints} sub={`of ${ANNUAL_TARGET} annual target`} icon={Award} tint="purple" />
        <Stat title="Verified activities" value={stats.verified.length} sub="activities approved" icon={FileCheck2} tint="blue" />
        <Stat title="Pending review" value={stats.pending.length} sub="awaiting CSU verification" icon={Clock3} tint="pink" />
        <Stat title="Profile completion" value={`${stats.profileCompletion}%`} sub={stats.profileCompletion === 100 ? "All set" : "Complete your profile"} icon={UserRound} tint="black" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_.8fr]">
        <Card title="CPD progress" action={<button onClick={() => navigate("/cpd")} className="text-xs font-bold text-[#7c3aed]">View details</button>}>
          <div className="grid gap-6 md:grid-cols-[1fr_180px] md:items-center">
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm font-semibold text-slate-600">Annual target</span>
                <span className="text-sm font-extrabold text-[#7c3aed]">
                  {stats.totalPoints} / {ANNUAL_TARGET}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-md bg-slate-100">
                <div className="h-full rounded-md bg-[#7c3aed]" style={{ width: `${stats.progressPct}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{Math.max(0, ANNUAL_TARGET - stats.totalPoints)} points remaining</span>
                <span>{stats.progressPct}% complete</span>
              </div>
              <div className="mt-5 rounded-md bg-[#f3ebfd] p-3 text-xs leading-5 text-slate-600">
                <b className="text-[#5b21b6]">Tip:</b> Add your next workshop or conference activity as soon as you receive the evidence certificate.
              </div>
            </div>
            <div className="mx-auto grid h-36 w-36 place-items-center rounded-md border-2 border-[#7c3aed] bg-[#f8f7fb]">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#7c3aed]">{stats.progressPct}%</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">complete</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Quick actions">
          <div className="grid gap-2">
            <QuickAction icon={Upload} title="Submit CPD activity" text="Add a certificate or evidence" onClick={() => navigate("/upload")} />
            <QuickAction icon={CalendarDays} title="Browse training" text="Find upcoming opportunities" onClick={() => navigate("/events")} />
            <QuickAction icon={BookOpen} title="Open resources" text="Guidelines and learning materials" onClick={() => navigate("/resources")} />
          </div>
        </Card>
      </div>

      <Card title="Recent CPD activity" action={<button onClick={() => navigate("/cpd")} className="text-xs font-bold text-[#7c3aed]">See all</button>}>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
        ) : (
          <ActivityTable activities={submissions.slice(0, 3)} />
        )}
      </Card>
    </div>
  );
}
