import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { store, UPLOADS_DIR } from "../lib/store.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";

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

router.post("/cpd", requireAuth, (req, res) => {
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
