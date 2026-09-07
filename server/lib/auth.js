import jwt from "jsonwebtoken";
import { store } from "./store.js";

export const JWT_SECRET = process.env.JWT_SECRET || "csu-dev-secret-change-in-production";
export const COOKIE_NAME = "csu_token";

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Using an insecure default — set JWT_SECRET before deploying to production.");
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

// Verifies the session AND re-checks the account's current role/status against the
// database on every request, so a suspended or demoted account loses access immediately
// rather than only when its (up to 7-day-old) token expires.
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  const db = store.read();
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user) return res.status(401).json({ error: "This account no longer exists." });
  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended. Contact CSU administration." });
  }

  req.auth = { sub: user.id, role: user.role };
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

export const requireAdmin = requireRole("admin");

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}
