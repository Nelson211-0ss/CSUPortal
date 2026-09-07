import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import * as users from "../db/users.js";
import { signToken, requireAuth, publicUser, COOKIE_NAME, COOKIE_OPTS } from "../lib/auth.js";

const router = Router();

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
      role: "professional",
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

  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const normalizedEmail = String(email).trim().toLowerCase();

  if (isLockedOut(normalizedEmail)) {
    return res.status(429).json({ error: "Too many failed attempts. Please try again in a few minutes." });
  }

  const user = await users.findByEmail(normalizedEmail);
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
