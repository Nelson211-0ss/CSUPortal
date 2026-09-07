import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Lock, Mail, Plus, ShieldCheck, ShieldOff, Stethoscope, User, UserCog, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, Field, MiniMetric, PageIntro } from "../components/ui";

const CATEGORIES = ["Cytotechnologist", "Laboratory Technologist", "Pathologist", "Medical Officer", "Nurse", "Student", "Dentist", "Other"];

function CreateUserModal({ onClose, onCreated, notify }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "professional", professionalCategory: CATEGORIES[0] });
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.role === "admin") delete payload.professionalCategory;
      await api.createUser(payload);
      notify(`${form.name}'s account has been created.`);
      onCreated();
    } catch (err) {
      notify(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">Add new user</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" required icon={User} value={form.name} onChange={set("name")} />
          <Field label="Email address" required type="email" icon={Mail} value={form.email} onChange={set("email")} />
          <Field label="Temporary password" required type="password" icon={Lock} revealable minLength={6} value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
          <Field label="Role" required select options={["professional", "admin"]} value={form.role} onChange={set("role")} />
          {form.role === "professional" && (
            <Field label="Professional category" select icon={Stethoscope} options={CATEGORIES} value={form.professionalCategory} onChange={set("professionalCategory")} />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { notify } = useOutletContext();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .adminListUsers()
      .then(({ users }) => setUsers(users))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (u) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    if (next === "suspended" && !window.confirm(`Suspend ${u.name}? They will immediately lose access to the portal.`)) return;
    setBusyId(u.id);
    try {
      await api.updateUserStatus(u.id, next);
      notify(`${u.name} is now ${next}.`);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleRole = async (u) => {
    const next = u.role === "admin" ? "professional" : "admin";
    if (!window.confirm(`Change ${u.name}'s role to ${next}?`)) return;
    setBusyId(u.id);
    try {
      await api.updateUserRole(u.id, next);
      notify(`${u.name} is now ${next === "admin" ? "an administrator" : "a professional"}.`);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === "All" ? users : users.filter((u) => (filter === "Admins" ? u.role === "admin" : filter === "Suspended" ? u.status === "suspended" : u.role === "professional"));
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalProfessionals = users.filter((u) => u.role === "professional").length;
  const totalSuspended = users.filter((u) => u.status === "suspended").length;

  return (
    <div className="fade-up space-y-6">
      <PageIntro
        title="Member management"
        text="Review CSU portal accounts, manage roles and control access."
        icon={Users}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#6d28d9]"
          >
            <Plus size={16} /> Add user
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <MiniMetric label="Professionals" value={totalProfessionals} suffix="accounts" />
        <MiniMetric label="Administrators" value={totalAdmins} suffix="accounts" />
        <MiniMetric label="Suspended" value={totalSuspended} suffix="accounts" />
      </div>

      <Card
        title="All accounts"
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none">
            <option>All</option>
            <option>Professionals</option>
            <option>Admins</option>
            <option>Suspended</option>
          </select>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-3 font-bold">Name</th>
                  <th className="px-3 py-3 font-bold">Email</th>
                  <th className="px-3 py-3 font-bold">Category</th>
                  <th className="px-3 py-3 font-bold">Role</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === me?.id;
                  return (
                    <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                      <td className="px-3 py-4">
                        <div className="font-semibold text-sm text-slate-900">{u.name}</div>
                        {isSelf && <div className="text-[10px] font-bold text-[#7c3aed]">You</div>}
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-500">{u.email}</td>
                      <td className="px-3 py-4 text-xs text-slate-500">{u.professionalCategory || "—"}</td>
                      <td className="px-3 py-4">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-[#f3ebfd] text-[#7c3aed]" : "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${u.status === "suspended" ? "bg-slate-900 text-white" : "bg-[#eaf1fe] text-[#2563eb]"}`}>
                          {u.status || "active"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={isSelf || busyId === u.id}
                            onClick={() => toggleRole(u)}
                            title={u.role === "admin" ? "Demote to professional" : "Promote to admin"}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <UserCog size={16} />
                          </button>
                          <button
                            disabled={isSelf || busyId === u.id}
                            onClick={() => toggleStatus(u)}
                            title={u.status === "suspended" ? "Reactivate account" : "Suspend account"}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          >
                            {u.status === "suspended" ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {showCreate && (
        <CreateUserModal
          notify={notify}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}
