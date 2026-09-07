import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BookOpen, Download, Trash2, UploadCloud } from "lucide-react";
import { api } from "../api";
import { Card, Field, PageIntro } from "../components/ui";

const CATEGORIES = ["Guideline", "Reference", "Research", "Training Module"];

export default function AdminMaterials() {
  const { notify } = useOutletContext();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0], description: "" });
  const [file, setFile] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .listMaterials()
      .then(({ materials }) => setMaterials(materials))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return notify("Please choose a file to upload.");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("file", file);
      await api.uploadMaterial(fd);
      notify("Material published.");
      setForm({ title: "", category: CATEGORIES[0], description: "" });
      setFile(null);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove "${m.title}"? This cannot be undone.`)) return;
    setBusyId(m.id);
    try {
      await api.deleteMaterial(m.id);
      notify("Material removed.");
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="CPD materials" text="Publish official CPD guidelines and training resources for members to access." icon={BookOpen} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card title="Publish new material">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Title" required value={form.title} onChange={set("title")} placeholder="e.g. Cervical Cytology Reporting Guide" />
            <Field label="Category" select options={CATEGORIES} value={form.category} onChange={set("category")} />
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={set("description")}
                className="w-full resize-none rounded-md border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa] focus:ring-4 focus:ring-[#f3ebfd]"
                placeholder="Short description of this resource"
              />
            </div>
            <label className="block cursor-pointer rounded-md border-2 border-dashed border-[#c9b3f5] bg-[#faf7ff] p-5 text-center hover:bg-[#f3ebfd]">
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <UploadCloud size={22} className="mx-auto text-[#7c3aed]" />
              <div className="mt-2 text-sm font-bold">{file ? file.name : "Choose file"}</div>
              <div className="mt-1 text-xs text-slate-400">PDF, Word, PowerPoint, JPG or PNG · Max 20 MB</div>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-60"
            >
              {submitting ? "Publishing..." : "Publish material"}
            </button>
          </form>
        </Card>

        <Card title="Published materials">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
          ) : materials.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Nothing published yet.</div>
          ) : (
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-4">
                  <div className="min-w-0">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.category}</span>
                    <div className="mt-1 font-semibold text-sm text-slate-900">{m.title}</div>
                    {m.description && <p className="mt-1 text-xs text-slate-500">{m.description}</p>}
                    <p className="mt-1 text-[11px] text-slate-400">Published {new Date(m.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a href={api.materialFileUrl(m.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Download">
                      <Download size={16} />
                    </a>
                    <button disabled={busyId === m.id} onClick={() => remove(m)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
