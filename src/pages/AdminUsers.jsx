import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ShieldCheck, ShieldOff, UserCog, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Card, MiniMetric, PageIntro } from "../components/ui";

export default function AdminUsers() {
  const { notify } = useOutletContext();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

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
      <PageIntro title="Member management" text="Review CSU portal accounts, manage roles and control access." icon={Users} />
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
    </div>
  );
}
