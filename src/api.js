// In dev this stays "/api" and rides Vite's proxy. In production, set
// VITE_API_URL (in a Vercel env var) to the VPS backend's full origin, e.g.
// "https://api.example.org/api" — the frontend and backend are on different
// domains, so a relative path won't reach the backend.
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(BASE + path, {
    credentials: "include",
    ...opts,
    headers: isForm
      ? opts.headers
      : { "Content-Type": "application/json", ...(opts.headers || {}) },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  updateMe: (payload) => request("/me", { method: "PUT", body: JSON.stringify(payload) }),

  listCpd: () => request("/cpd"),
  submitCpd: (formData) => request("/cpd", { method: "POST", body: formData }),
  evidenceUrl: (id) => `${BASE}/cpd/${id}/evidence`,
  evidencePreviewUrl: (id) => `${BASE}/cpd/${id}/evidence/preview`,
  certificateUrl: (id) => `${BASE}/cpd/${id}/certificate`,

  adminListCpd: () => request("/admin/cpd"),
  verifyCpd: (id, payload) => request(`/admin/cpd/${id}/verify`, { method: "PATCH", body: JSON.stringify(payload) }),

  events: () => request("/events"),

  listMaterials: () => request("/materials"),
  materialFileUrl: (id) => `${BASE}/materials/${id}/file`,
  materialPreviewUrl: (id) => `${BASE}/materials/${id}/preview`,
  uploadMaterial: (formData) => request("/admin/materials", { method: "POST", body: formData }),
  deleteMaterial: (id) => request(`/admin/materials/${id}`, { method: "DELETE" }),

  adminListUsers: () => request("/admin/users"),
  createUser: (payload) => request("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  adminAnalytics: () => request("/admin/analytics"),
};
