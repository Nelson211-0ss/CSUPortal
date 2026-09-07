import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { store } from "../lib/store.js";
import { requireAuth, requireAdmin, publicUser } from "../lib/auth.js";

const router = Router();

const ANNUAL_TARGET = 30;

router.get("/admin/users", requireAuth, requireAdmin, (req, res) => {
  const db = store.read();
  const users = db.users
    .map(publicUser)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ users });
});

// Lets an admin create an account directly (professional or admin) with a role
// assigned up front, rather than waiting for the person to self-register.
router.post("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role, professionalCategory, licenceNumber, phone, institution, designation } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (!["professional", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'professional' or 'admin'." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const result = await store.mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { error: "An account with this email already exists." };
    }
    const user = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      status: "active",
      professionalCategory: professionalCategory || "",
      licenceNumber: licenceNumber || "",
      phone: phone || "",
      institution: institution || "",
      designation: designation || "",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return { user };
  });

  if (result.error) return res.status(409).json({ error: result.error });
  res.status(201).json({ user: publicUser(result.user) });
});

router.patch("/admin/users/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'active' or 'suspended'." });
  }
  if (req.params.id === req.auth.sub) {
    return res.status(400).json({ error: "You cannot change your own account status." });
  }

  const result = await store.mutate((db) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return { error: "User not found." };
    user.status = status;
    return { user };
  });

  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ user: publicUser(result.user) });
});

router.patch("/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!["professional", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'professional' or 'admin'." });
  }
  if (req.params.id === req.auth.sub) {
    return res.status(400).json({ error: "You cannot change your own role." });
  }

  const result = await store.mutate((db) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return { error: "User not found." };
    if (user.role === "admin" && role === "professional") {
      const remainingAdmins = db.users.filter((u) => u.role === "admin" && u.id !== user.id).length;
      if (remainingAdmins === 0) return { error: "At least one administrator account must remain." };
    }
    user.role = role;
    return { user };
  });

  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ user: publicUser(result.user) });
});

router.get("/admin/analytics", requireAuth, requireAdmin, (req, res) => {
  const db = store.read();
  const professionals = db.users.filter((u) => u.role === "professional");
  const submissions = db.cpdSubmissions;

  const verifiedPointsByUser = new Map();
  for (const s of submissions) {
    if (s.status === "Verified") {
      verifiedPointsByUser.set(s.userId, (verifiedPointsByUser.get(s.userId) || 0) + Number(s.pointsClaimed || 0));
    }
  }
  const compliantCount = professionals.filter((u) => (verifiedPointsByUser.get(u.id) || 0) >= ANNUAL_TARGET).length;

  const byCategory = {};
  for (const u of professionals) {
    const key = u.professionalCategory || "Unspecified";
    byCategory[key] = (byCategory[key] || 0) + 1;
  }

  const byStatus = { Pending: 0, Verified: 0, Rejected: 0 };
  let totalVerifiedPoints = 0;
  for (const s of submissions) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    if (s.status === "Verified") totalVerifiedPoints += Number(s.pointsClaimed || 0);
  }

  res.json({
    totalMembers: professionals.length,
    activeMembers: professionals.filter((u) => u.status !== "suspended").length,
    suspendedMembers: professionals.filter((u) => u.status === "suspended").length,
    totalAdmins: db.users.filter((u) => u.role === "admin").length,
    totalSubmissions: submissions.length,
    submissionsByStatus: byStatus,
    totalVerifiedPoints,
    complianceRate: professionals.length ? Math.round((compliantCount / professionals.length) * 100) : 0,
    compliantMembers: compliantCount,
    annualTarget: ANNUAL_TARGET,
    membersByCategory: byCategory,
    totalMaterials: db.materials.length,
  });
});

export default router;
