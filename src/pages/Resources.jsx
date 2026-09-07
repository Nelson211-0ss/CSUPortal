import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BarChart3, BookOpen, Download, Eye, FileText, HeartPulse } from "lucide-react";
import { api } from "../api";
import { Card, PageIntro, PreviewModal } from "../components/ui";

const ICONS = { Guideline: FileText, Reference: BookOpen, Research: BarChart3 };

export default function Resources() {
  const { notify } = useOutletContext();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    api
      .listMaterials()
      .then(({ materials }) => setMaterials(materials))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="Professional resources" text="Official CPD guidelines, training modules and learning materials published by CSU." icon={BookOpen} />
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : materials.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-sm text-slate-400">No resources have been published yet.</div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {materials.map((m) => {
            const Icon = ICONS[m.category] || HeartPulse;
            return (
              <Card key={m.id}>
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#f3ebfd] text-[#7c3aed]">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.category}</span>
                    <h3 className="mt-2 font-extrabold">{m.title}</h3>
                    {m.description && <p className="mt-1 text-sm leading-6 text-slate-500">{m.description}</p>}
                    <div className="mt-4 flex items-center gap-4">
                      <button onClick={() => setPreview(m)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
                        Preview <Eye size={14} />
                      </button>
                      <a href={api.materialFileUrl(m.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7c3aed]">
                        Download <Download size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {preview && (
        <PreviewModal
          title={preview.title}
          filename={preview.originalName}
          previewUrl={api.materialPreviewUrl(preview.id)}
          downloadUrl={api.materialFileUrl(preview.id)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
