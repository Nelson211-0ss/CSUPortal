import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

function seedDb() {
  const adminId = crypto.randomUUID();
  return {
    users: [
      {
        id: adminId,
        name: "CSU Administrator",
        email: "admin@csu.ug",
        passwordHash: bcrypt.hashSync("Admin@123", 10),
        role: "admin",
        professionalCategory: "Other",
        licenceNumber: "",
        phone: "",
        institution: "Cytology Society of Uganda",
        designation: "CPD Administrator",
        createdAt: new Date().toISOString(),
      },
    ],
    cpdSubmissions: [],
    events: [
      { id: crypto.randomUUID(), title: "National Cytology Quality Workshop", date: "2026-09-18", mode: "Kampala · In person", points: 8, type: "Workshop" },
      { id: crypto.randomUUID(), title: "Cervical Cancer Screening Masterclass", date: "2026-10-03", mode: "Online", points: 5, type: "Training" },
      { id: crypto.randomUUID(), title: "CSU Annual Scientific Conference", date: "2026-11-21", mode: "Kampala · In person", points: 10, type: "Conference" },
    ],
    resources: [
      { id: crypto.randomUUID(), title: "CPD Guidelines", text: "Guidance for recording, submitting and verifying professional development activities.", category: "Guideline" },
      { id: crypto.randomUUID(), title: "Cytology Practice Resources", text: "Reference materials and professional learning resources for cytology practitioners.", category: "Reference" },
      { id: crypto.randomUUID(), title: "Cancer Screening Information", text: "Resources supporting early detection, screening and patient-centered care.", category: "Reference" },
      { id: crypto.randomUUID(), title: "Research & Publications", text: "Access CSU research, publications and knowledge-sharing materials.", category: "Research" },
    ],
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedDb(), null, 2));
  }
}

function read() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function write(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Simple synchronous mutation queue to avoid concurrent write clobbering.
let chain = Promise.resolve();
function mutate(fn) {
  const run = async () => {
    const db = read();
    const result = fn(db);
    write(db);
    return result;
  };
  chain = chain.then(run, run);
  return chain;
}

export const store = {
  read,
  mutate,
};
