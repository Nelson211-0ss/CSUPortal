import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploaded files (CPD evidence, CPD materials) still live on local disk —
// only structured data moved to Postgres. On the VPS this directory must be
// backed up and excluded from anything that wipes the app directory on deploy.
export const UPLOADS_DIR = path.join(__dirname, "..", "data", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
