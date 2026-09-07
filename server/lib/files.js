import path from "node:path";

const MIME_TYPES = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

// Only PDFs and images can be rendered inline by a browser; other formats
// (Word, PowerPoint) fall back to download-only on the frontend.
export function isPreviewable(filename) {
  return Object.prototype.hasOwnProperty.call(MIME_TYPES, path.extname(filename).toLowerCase());
}

export function sendInline(res, filePath, filename) {
  const mime = MIME_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream";
  res.set("Content-Type", mime);
  res.set("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
  res.sendFile(filePath);
}
