import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Award, Building2, CalendarDays, MoreHorizontal } from "lucide-react";
import { api } from "../api";
import { Card, PageIntro } from "../components/ui";

export default function Events() {
  const { notify } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .events()
      .then(({ events }) => setEvents(events))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="Events & training" text="Discover workshops, conferences, training sessions and other professional learning opportunities." icon={CalendarDays} />
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-[#f3ebfd] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#7c3aed]">{e.type}</span>
                <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <h3 className="mt-4 text-base font-extrabold leading-6">{e.title}</h3>
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} /> {e.date}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} /> {e.mode}
                </div>
                <div className="flex items-center gap-2">
                  <Award size={14} /> {e.points} CPD points
                </div>
              </div>
              <button onClick={() => notify("Event details opened.")} className="mt-5 w-full rounded-md border border-slate-200 py-2.5 text-xs font-bold hover:bg-slate-50">
                View details
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
