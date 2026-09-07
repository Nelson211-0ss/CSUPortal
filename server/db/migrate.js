import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, query } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log("Applying schema...");
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await query(schema);

  const { rows: userRows } = await query("SELECT count(*)::int AS count FROM users");
  if (userRows[0].count === 0) {
    console.log("Seeding default admin account (admin@csu.ug / Admin@123 — change this immediately)...");
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, status, professional_category, institution, designation)
       VALUES ($1, $2, $3, $4, 'admin', 'active', 'Other', $5, $6)`,
      [
        crypto.randomUUID(),
        "CSU Administrator",
        "admin@csu.ug",
        bcrypt.hashSync("Admin@123", 10),
        "Cytology Society of Uganda",
        "CPD Administrator",
      ]
    );
  } else {
    console.log(`Users table already has ${userRows[0].count} account(s) — skipping admin seed.`);
  }

  const { rows: eventRows } = await query("SELECT count(*)::int AS count FROM events");
  if (eventRows[0].count === 0) {
    console.log("Seeding sample events...");
    const events = [
      ["National Cytology Quality Workshop", "2026-09-18", "Kampala · In person", 8, "Workshop"],
      ["Cervical Cancer Screening Masterclass", "2026-10-03", "Online", 5, "Training"],
      ["CSU Annual Scientific Conference", "2026-11-21", "Kampala · In person", 10, "Conference"],
    ];
    for (const [title, date, mode, points, type] of events) {
      await query(`INSERT INTO events (id, title, date, mode, points, type) VALUES ($1, $2, $3, $4, $5, $6)`, [
        crypto.randomUUID(),
        title,
        date,
        mode,
        points,
        type,
      ]);
    }
  } else {
    console.log(`Events table already has ${eventRows[0].count} row(s) — skipping event seed.`);
  }

  console.log("Done.");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
