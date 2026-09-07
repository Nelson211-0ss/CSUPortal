import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import * as materials from "../db/materials.js";
import { UPLOADS_DIR } from "../lib/uploads.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { sendInline } from "../lib/files.js";

const router = Router();

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"]);
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error("Only PDF, Word, PowerPoint, JPG or PNG files are allowed."));
    cb(null, true);
  },
});

// Any authenticated portal user (professional or admin) can browse and download materials.
router.get("/materials", requireAuth, async (req, res) => {
  const list = await materials.list();
  res.json({ materials: list });
});

router.get("/materials/:id/file", requireAuth, async (req, res) => {
  const material = await materials.findById(req.params.id);
  if (!material) return res.status(404).json({ error: "Material not found." });
  const filePath = path.join(UPLOADS_DIR, material.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File no longer available." });
  res.download(filePath, material.originalName || material.file);
});

// Renders the file inline (no forced download) so it can be previewed before downloading.
router.get("/materials/:id/preview", requireAuth, async (req, res) => {
  const material = await materials.findById(req.params.id);
  if (!material) return res.status(404).json({ error: "Material not found." });
  const filePath = path.join(UPLOADS_DIR, material.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File no longer available." });
  sendInline(res, filePath, material.originalName || material.file);
});

// Only admins may publish or remove materials.
router.post("/admin/materials", requireAuth, requireAdmin, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { title, category, description } = req.body || {};
    if (!title || !req.file) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Title and a file are required." });
    }

    const material = await materials.create({
      id: crypto.randomUUID(),
      title: title.trim(),
      category: category || "General",
      description: description || "",
      file: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy: req.auth.sub,
    });

    res.status(201).json({ material });
  });
});

router.delete("/admin/materials/:id", requireAuth, requireAdmin, async (req, res) => {
  const removed = await materials.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: "Material not found." });
  const filePath = path.join(UPLOADS_DIR, removed.file);
  fs.unlink(filePath, () => {});
  res.json({ ok: true });
});

export default router;
