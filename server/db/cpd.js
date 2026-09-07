import { query } from "./pool.js";

function mapSubmission(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    professionalCategory: row.professional_category,
    licenceNumber: row.licence_number,
    phone: row.phone,
    institution: row.institution,
    designation: row.designation,
    activityTitle: row.activity_title,
    activityDate: row.activity_date,
    cpdCategory: row.cpd_category,
    pointsClaimed: row.points_claimed,
    notes: row.notes,
    evidenceFile: row.evidence_file,
    evidenceOriginalName: row.evidence_original_name,
    status: row.status,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    reviewNote: row.review_note,
  };
}

export async function create(sub) {
  const { rows } = await query(
    `INSERT INTO cpd_submissions
       (id, user_id, name, email, professional_category, licence_number, phone, institution, designation,
        activity_title, activity_date, cpd_category, points_claimed, notes, evidence_file, evidence_original_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      sub.id,
      sub.userId,
      sub.name,
      sub.email,
      sub.professionalCategory,
      sub.licenceNumber,
      sub.phone,
      sub.institution,
      sub.designation,
      sub.activityTitle,
      sub.activityDate,
      sub.cpdCategory,
      sub.pointsClaimed,
      sub.notes,
      sub.evidenceFile,
      sub.evidenceOriginalName,
    ]
  );
  return mapSubmission(rows[0]);
}

export async function findById(id) {
  const { rows } = await query("SELECT * FROM cpd_submissions WHERE id = $1", [id]);
  return mapSubmission(rows[0]);
}

export async function listByUser(userId) {
  const { rows } = await query("SELECT * FROM cpd_submissions WHERE user_id = $1 ORDER BY submitted_at DESC", [userId]);
  return rows.map(mapSubmission);
}

export async function listAll() {
  const { rows } = await query("SELECT * FROM cpd_submissions ORDER BY submitted_at DESC");
  return rows.map(mapSubmission);
}

export async function verify(id, { status, verifiedBy, reviewNote }) {
  const { rows } = await query(
    `UPDATE cpd_submissions
     SET status = $1, verified_at = now(), verified_by = $2, review_note = $3
     WHERE id = $4
     RETURNING *`,
    [status, verifiedBy, reviewNote || "", id]
  );
  return mapSubmission(rows[0]);
}

export async function countAll() {
  const { rows } = await query("SELECT count(*)::int AS count FROM cpd_submissions");
  return rows[0].count;
}

export async function countByStatus() {
  const { rows } = await query("SELECT status, count(*)::int AS count FROM cpd_submissions GROUP BY status");
  const result = { Pending: 0, Verified: 0, Rejected: 0 };
  for (const row of rows) result[row.status] = row.count;
  return result;
}

export async function totalVerifiedPoints() {
  const { rows } = await query("SELECT coalesce(sum(points_claimed), 0)::float8 AS total FROM cpd_submissions WHERE status = 'Verified'");
  return rows[0].total;
}

// Verified points earned per user — used to compute annual-target compliance.
export async function verifiedPointsByUser() {
  const { rows } = await query(
    "SELECT user_id, sum(points_claimed)::float8 AS total FROM cpd_submissions WHERE status = 'Verified' GROUP BY user_id"
  );
  return new Map(rows.map((r) => [r.user_id, r.total]));
}
