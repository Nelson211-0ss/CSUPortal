import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Field, PageIntro } from "../components/ui";

const CATEGORIES = ["Cytotechnologist", "Laboratory Technologist", "Pathologist", "Medical Officer", "Nurse", "Student", "Dentist", "Other"];

export default function Profile() {
  const { notify } = useOutletContext();
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        professionalCategory: user.professionalCategory || CATEGORIES[0],
        licenceNumber: user.licenceNumber || "",
        phone: user.phone || "",
        institution: user.institution || "",
        designation: user.designation || "",
      });
    }
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.updateMe(form);
      await refreshUser();
      notify("Profile changes saved.");
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || !form) return null;

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="fade-up space-y-6">
      <PageIntro title="My professional profile" text="Keep your contact, institution and professional information current." icon={UserRound} />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card>
          <div className="text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-md bg-[#f3ebfd] text-2xl font-extrabold text-[#7c3aed]">{initials}</div>
            <h2 className="mt-4 font-extrabold">{user.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{user.designation || user.professionalCategory}</p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-md bg-[#eaf1fe] px-3 py-1 text-[10px] font-bold text-[#2563eb]">
              <ShieldCheck size={12} /> {user.role === "admin" ? "Administrator" : "Professional account"}
            </span>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex gap-2 py-2">
              <Mail size={14} /> {user.email}
            </div>
            <div className="flex gap-2 py-2">
              <Phone size={14} /> {user.phone || "Not provided"}
            </div>
          </div>
        </Card>
        <Card title="Professional information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={set("name")} />
            <Field label="Email address" value={user.email} disabled />
            <Field label="Professional category" select options={CATEGORIES} value={form.professionalCategory} onChange={set("professionalCategory")} />
            <Field label="Licence number" value={form.licenceNumber} onChange={set("licenceNumber")} />
            <Field label="Phone number" value={form.phone} onChange={set("phone")} />
            <Field label="Institution" value={form.institution} onChange={set("institution")} />
            <Field label="Designation" value={form.designation} onChange={set("designation")} />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6d28d9] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
