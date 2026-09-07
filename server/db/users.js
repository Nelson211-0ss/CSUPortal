import { query } from "./pool.js";

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    professionalCategory: row.professional_category,
    licenceNumber: row.licence_number,
    phone: row.phone,
    institution: row.institution,
    designation: row.designation,
    createdAt: row.created_at,
  };
}

export async function findByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  return mapUser(rows[0]);
}

export async function findById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  return mapUser(rows[0]);
}

export async function list() {
  const { rows } = await query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(mapUser);
}

export async function countAdmins({ excludeId } = {}) {
  const { rows } = await query("SELECT count(*)::int AS count FROM users WHERE role = 'admin' AND id != $1", [
    excludeId || "00000000-0000-0000-0000-000000000000",
  ]);
  return rows[0].count;
}

export async function create({
  id,
  name,
  email,
  passwordHash,
  role,
  status = "active",
  professionalCategory = "",
  licenceNumber = "",
  phone = "",
  institution = "",
  designation = "",
}) {
  const { rows } = await query(
    `INSERT INTO users (id, name, email, password_hash, role, status, professional_category, licence_number, phone, institution, designation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [id, name, email, passwordHash, role, status, professionalCategory, licenceNumber, phone, institution, designation]
  );
  return mapUser(rows[0]);
}

export async function updateProfile(id, fields) {
  const columns = {
    name: "name",
    professionalCategory: "professional_category",
    licenceNumber: "licence_number",
    phone: "phone",
    institution: "institution",
    designation: "designation",
  };
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
  return mapUser(rows[0]);
}

export async function updateStatus(id, status) {
  const { rows } = await query("UPDATE users SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
  return mapUser(rows[0]);
}

export async function updateRole(id, role) {
  const { rows } = await query("UPDATE users SET role = $1 WHERE id = $2 RETURNING *", [role, id]);
  return mapUser(rows[0]);
}
