import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { store, UPLOADS_DIR } from "../lib/store.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";

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
router.get("/materials", requireAuth, (req, res) => {
  const db = store.read();
  const materials = [...db.materials].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json({ materials });
});

router.get("/materials/:id/file", requireAuth, (req, res) => {
  const db = store.read();
  const material = db.materials.find((m) => m.id === req.params.id);
  if (!material) return res.status(404).json({ error: "Material not found." });
  const filePath = path.join(UPLOADS_DIR, material.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File no longer available." });
  res.download(filePath, material.originalName || material.file);
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

    const material = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: category || "General",
      description: description || "",
      file: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy: req.auth.sub,
      uploadedAt: new Date().toISOString(),
    };

    await store.mutate((db) => {
      db.materials.push(material);
    });

    res.status(201).json({ material });
  });
});

router.delete("/admin/materials/:id", requireAuth, requireAdmin, async (req, res) => {
  const result = await store.mutate((db) => {
    const idx = db.materials.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return { error: "Material not found." };
    const [removed] = db.materials.splice(idx, 1);
    return { removed };
  });

  if (result.error) return res.status(404).json({ error: result.error });
  const filePath = path.join(UPLOADS_DIR, result.removed.file);
  fs.unlink(filePath, () => {});
  res.json({ ok: true });
});

export default router;
