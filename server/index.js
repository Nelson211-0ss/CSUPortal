import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import cpdRoutes from "./routes/cpd.js";
import contentRoutes from "./routes/content.js";
import materialsRoutes from "./routes/materials.js";
import adminRoutes from "./routes/admin.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error("FATAL: JWT_SECRET must be set to a strong random value (32+ characters) in production.");
  console.error("Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4310;

// Behind a reverse proxy (nginx, Caddy, Cloudflare) on the VPS, this makes
// req.secure / req.ip reflect the real client connection rather than the
// proxy's, which secure cookies and rate limiting both depend on.
app.set("trust proxy", 1);

// The frontend (Vercel) and backend (VPS) are on different origins, so every
// origin allowed to send credentialed requests must be listed explicitly.
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    // This API intentionally serves file previews (PDF/image) and a certificate
    // page meant to be embedded/opened by the frontend, which lives on a
    // different origin — a strict default CSP or X-Frame-Options would block
    // exactly that legitimate cross-origin embedding, so both are relaxed here.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: false,
  })
);
app.use(compression());

// Defense-in-depth on top of the login-specific throttle in routes/auth.js.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", cpdRoutes);
app.use("/api", contentRoutes);
app.use("/api", materialsRoutes);
app.use("/api", adminRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.message?.includes("not allowed by CORS")) {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`CSU backend listening on port ${PORT} (${IS_PRODUCTION ? "production" : "development"})`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
