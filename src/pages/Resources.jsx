import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, FileText, HeartPulse } from "lucide-react";
import { api } from "../api";
import { Card, PageIntro } from "../components/ui";

const ICONS = { Guideline: FileText, Reference: BookOpen, Research: BarChart3 };

export default function Resources() {
  const { notify } = useOutletContext();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .resources()
      .then(({ resources }) => setResources(resources))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="Professional resources" text="Practical information to support quality cytology practice, learning, research and professional development." icon={BookOpen} />
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {resources.map((r) => {
            const Icon = ICONS[r.category] || HeartPulse;
            return (
              <Card key={r.id}>
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#f3ebfd] text-[#7c3aed]">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold">{r.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{r.text}</p>
                    <button onClick={() => notify("Resource opened.")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#7c3aed]">
                      Open resource <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
