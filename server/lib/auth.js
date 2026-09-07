import jwt from "jsonwebtoken";
import * as users from "../db/users.js";

// index.js refuses to start in production without a real JWT_SECRET; this
// fallback only ever applies to local development.
export const JWT_SECRET = process.env.JWT_SECRET || "csu-dev-secret-change-in-production";
export const COOKIE_NAME = "csu_token";

// Frontend (Vercel) and backend (VPS) are on different origins by default, so
// the session cookie needs SameSite=None + Secure to be sent cross-site at all.
// If you instead deploy the frontend and backend as subdomains of the SAME
// registrable domain (e.g. app.example.org + api.example.org — recommended,
// since it sidesteps browsers' third-party-cookie restrictions), set
// COOKIE_SAMESITE=lax to get a more conventional, restrictive cookie.
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === "production" ? "none" : "lax");

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: COOKIE_SAMESITE,
  // SameSite=None is rejected by browsers unless Secure is also set.
  secure: COOKIE_SAMESITE === "none" || process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  console.warn("WARNING: JWT_SECRET is not set. Using an insecure default — set JWT_SECRET before deploying to production.");
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

// Verifies the session AND re-checks the account's current role/status against the
// database on every request, so a suspended or demoted account loses access immediately
// rather than only when its (up to 7-day-old) token expires.
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  const user = await users.findById(payload.sub);
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
