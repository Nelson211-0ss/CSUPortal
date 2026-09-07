import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import * as users from "../db/users.js";
import * as cpd from "../db/cpd.js";
import * as materials from "../db/materials.js";
import { requireAuth, requireAdmin, publicUser } from "../lib/auth.js";

const router = Router();

const ANNUAL_TARGET = 30;

router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const list = await users.list();
  res.json({ users: list.map(publicUser) });
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

  if (await users.findByEmail(normalizedEmail)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  let user;
  try {
    user = await users.create({
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      professionalCategory: professionalCategory || "",
      licenceNumber: licenceNumber || "",
      phone: phone || "",
      institution: institution || "",
      designation: designation || "",
    });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "An account with this email already exists." });
    throw err;
  }

  res.status(201).json({ user: publicUser(user) });
});

router.patch("/admin/users/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'active' or 'suspended'." });
  }
  if (req.params.id === req.auth.sub) {
    return res.status(400).json({ error: "You cannot change your own account status." });
  }

  const existing = await users.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found." });

  const user = await users.updateStatus(req.params.id, status);
  res.json({ user: publicUser(user) });
});

router.patch("/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!["professional", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'professional' or 'admin'." });
  }
  if (req.params.id === req.auth.sub) {
    return res.status(400).json({ error: "You cannot change your own role." });
  }

  const existing = await users.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found." });

  if (existing.role === "admin" && role === "professional") {
    const remainingAdmins = await users.countAdmins({ excludeId: existing.id });
    if (remainingAdmins === 0) return res.status(400).json({ error: "At least one administrator account must remain." });
  }

  const user = await users.updateRole(req.params.id, role);
  res.json({ user: publicUser(user) });
});

router.get("/admin/analytics", requireAuth, requireAdmin, async (req, res) => {
  const allUsers = await users.list();
  const professionals = allUsers.filter((u) => u.role === "professional");

  const [totalSubmissions, submissionsByStatus, totalVerifiedPoints, verifiedPointsByUser, totalMaterials] = await Promise.all([
    cpd.countAll(),
    cpd.countByStatus(),
    cpd.totalVerifiedPoints(),
    cpd.verifiedPointsByUser(),
    materials.count(),
  ]);

  const compliantCount = professionals.filter((u) => (verifiedPointsByUser.get(u.id) || 0) >= ANNUAL_TARGET).length;

  const byCategory = {};
  for (const u of professionals) {
    const key = u.professionalCategory || "Unspecified";
    byCategory[key] = (byCategory[key] || 0) + 1;
  }

  res.json({
    totalMembers: professionals.length,
    activeMembers: professionals.filter((u) => u.status !== "suspended").length,
    suspendedMembers: professionals.filter((u) => u.status === "suspended").length,
    totalAdmins: allUsers.filter((u) => u.role === "admin").length,
    totalSubmissions,
    submissionsByStatus,
    totalVerifiedPoints,
    complianceRate: professionals.length ? Math.round((compliantCount / professionals.length) * 100) : 0,
    compliantMembers: compliantCount,
    annualTarget: ANNUAL_TARGET,
    membersByCategory: byCategory,
    totalMaterials,
  });
});

export default router;
