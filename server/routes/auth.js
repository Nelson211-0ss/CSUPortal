import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { store } from "../lib/store.js";
import { signToken, requireAuth, publicUser, COOKIE_NAME } from "../lib/auth.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/register", async (req, res) => {
  const { name, email, password, professionalCategory, licenceNumber, phone, institution, designation } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
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
      role: "professional",
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

  const token = signToken(result.user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.status(201).json({ user: publicUser(result.user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const normalizedEmail = String(email).trim().toLowerCase();

  const db = store.read();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const db = store.read();
  const user = db.users.find((u) => u.id === req.auth.sub);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

export default router;
