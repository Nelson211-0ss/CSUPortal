import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { store, UPLOADS_DIR } from "../lib/store.js";
import { requireAuth, requireAdmin, requireRole } from "../lib/auth.js";

const router = Router();

const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error("Only PDF, JPG or PNG files are allowed."));
    cb(null, true);
  },
});

const REQUIRED_FIELDS = [
  "name",
  "email",
  "professionalCategory",
  "phone",
  "activityTitle",
  "activityDate",
  "cpdCategory",
  "pointsClaimed",
];

router.post("/cpd", requireAuth, requireRole("professional"), (req, res) => {
  upload.single("evidence")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const body = req.body || {};
    const missing = REQUIRED_FIELDS.filter((f) => !body[f] || String(body[f]).trim() === "");
    if (missing.length) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }
    const points = Number(body.pointsClaimed);
    if (!Number.isFinite(points) || points < 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "CPD points claimed must be a valid non-negative number." });
    }

    const submission = {
      id: crypto.randomUUID(),
      userId: req.auth.sub,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      professionalCategory: body.professionalCategory,
      licenceNumber: body.licenceNumber || "",
      phone: body.phone,
      institution: body.institution || "",
      designation: body.designation || "",
      activityTitle: body.activityTitle,
      activityDate: body.activityDate,
      cpdCategory: body.cpdCategory,
      pointsClaimed: points,
      notes: body.notes || "",
      evidenceFile: req.file ? req.file.filename : null,
      evidenceOriginalName: req.file ? req.file.originalname : null,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
      reviewNote: "",
    };

    await store.mutate((db) => {
      db.cpdSubmissions.push(submission);
    });

    res.status(201).json({ submission });
  });
});

router.get("/cpd", requireAuth, (req, res) => {
  const db = store.read();
  const mine = db.cpdSubmissions
    .filter((s) => s.userId === req.auth.sub)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json({ submissions: mine });
});

router.get("/cpd/:id/evidence", requireAuth, (req, res) => {
  const db = store.read();
  const submission = db.cpdSubmissions.find((s) => s.id === req.params.id);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  const isOwner = submission.userId === req.auth.sub;
  const isAdmin = req.auth.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized to view this file." });
  if (!submission.evidenceFile) return res.status(404).json({ error: "No evidence file for this submission." });

  const filePath = path.join(UPLOADS_DIR, submission.evidenceFile);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File no longer available." });
  res.download(filePath, submission.evidenceOriginalName || submission.evidenceFile);
});

router.get("/cpd/:id/certificate", requireAuth, (req, res) => {
  const db = store.read();
  const submission = db.cpdSubmissions.find((s) => s.id === req.params.id);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  const isOwner = submission.userId === req.auth.sub;
  if (!isOwner && req.auth.role !== "admin") return res.status(403).json({ error: "Not authorized to view this certificate." });
  if (submission.status !== "Verified") return res.status(400).json({ error: "Only verified activities have a certificate." });

  const verifier = db.users.find((u) => u.id === submission.verifiedBy);
  const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  res.set("Content-Type", "text/html").send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>CPD Certificate — ${escape(submission.name)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background:#f8f7fb; margin:0; padding:40px; }
  .cert { max-width: 820px; margin:0 auto; background:#fff; border:10px solid #2e1065; padding:56px; text-align:center; }
  .brand { font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:#7c3aed; font-weight:bold; }
  h1 { font-size:30px; color:#0b0b12; margin:18px 0 6px; }
  .sub { color:#555; font-size:14px; margin-bottom:28px; }
  .name { font-size:26px; font-weight:bold; color:#2e1065; margin:18px 0; border-bottom:2px solid #e5e0f0; display:inline-block; padding-bottom:6px; }
  .activity { font-size:18px; margin:10px 0 22px; color:#222; }
  .meta { display:flex; justify-content:center; gap:48px; margin-top:26px; font-size:13px; color:#444; }
  .meta b { display:block; color:#0b0b12; font-size:15px; }
  .footer { margin-top:44px; font-size:11px; color:#999; }
  @media print { body { background:#fff; padding:0; } .cert { border-width:8px; } .no-print { display:none; } }
</style>
</head>
<body>
  <div class="cert">
    <div class="brand">Cytology Society of Uganda</div>
    <h1>Certificate of CPD Completion</h1>
    <div class="sub">Advancing Cytology. Empowering Professionals. Improving Patient Care.</div>
    <p>This certifies that</p>
    <div class="name">${escape(submission.name)}</div>
    <p>successfully completed the following CPD activity, verified by CSU:</p>
    <div class="activity"><b>${escape(submission.activityTitle)}</b><br/>${escape(submission.cpdCategory)}</div>
    <div class="meta">
      <div>Date of activity<b>${escape(submission.activityDate)}</b></div>
      <div>CPD points<b>${escape(submission.pointsClaimed)}</b></div>
      <div>Verified on<b>${escape(new Date(submission.verifiedAt).toLocaleDateString())}</b></div>
    </div>
    <div class="footer">Verified by ${escape(verifier?.name || "CSU Administration")} · Certificate ID ${escape(submission.id)}</div>
  </div>
  <p class="no-print" style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="background:#7c3aed;color:#fff;border:none;border-radius:6px;padding:10px 18px;font-size:14px;cursor:pointer;">Print / Save as PDF</button>
  </p>
</body>
</html>`);
});

router.get("/admin/cpd", requireAuth, requireAdmin, (req, res) => {
  const db = store.read();
  const all = [...db.cpdSubmissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json({ submissions: all });
});

router.patch("/admin/cpd/:id/verify", requireAuth, requireAdmin, async (req, res) => {
  const { status, reviewNote } = req.body || {};
  if (!["Verified", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'Verified' or 'Rejected'." });
  }

  const result = await store.mutate((db) => {
    const submission = db.cpdSubmissions.find((s) => s.id === req.params.id);
    if (!submission) return { error: "Submission not found." };
    submission.status = status;
    submission.verifiedAt = new Date().toISOString();
    submission.verifiedBy = req.auth.sub;
    submission.reviewNote = reviewNote || "";
    return { submission };
  });

  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ submission: result.submission });
});

export default router;
