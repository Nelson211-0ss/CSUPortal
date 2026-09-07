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

// Basic brute-force throttle: after 5 failed attempts for an email, block further
// attempts for 5 minutes. In-memory only — resets on server restart, which is fine
// for a single-instance deployment.
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000;
const loginAttempts = new Map();

function isLockedOut(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.count < LOGIN_ATTEMPT_LIMIT) return false;
  if (Date.now() - entry.lastAttempt > LOGIN_LOCKOUT_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return true;
}

function recordFailedAttempt(key) {
  const entry = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
  entry.count += 1;
  entry.lastAttempt = Date.now();
  loginAttempts.set(key, entry);
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

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

  const token = signToken(result.user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.status(201).json({ user: publicUser(result.user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const normalizedEmail = String(email).trim().toLowerCase();

  if (isLockedOut(normalizedEmail)) {
    return res.status(429).json({ error: "Too many failed attempts. Please try again in a few minutes." });
  }

  const db = store.read();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    recordFailedAttempt(normalizedEmail);
    return res.status(401).json({ error: "Invalid email or password." });
  }
  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended. Contact CSU administration." });
  }

  clearAttempts(normalizedEmail);
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
