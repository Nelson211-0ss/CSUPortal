import { query } from "./pool.js";

function mapMaterial(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    file: row.file,
    originalName: row.original_name,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

export async function list() {
  const { rows } = await query("SELECT * FROM materials ORDER BY uploaded_at DESC");
  return rows.map(mapMaterial);
}

export async function findById(id) {
  const { rows } = await query("SELECT * FROM materials WHERE id = $1", [id]);
  return mapMaterial(rows[0]);
}

export async function create(material) {
  const { rows } = await query(
    `INSERT INTO materials (id, title, category, description, file, original_name, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [material.id, material.title, material.category, material.description, material.file, material.originalName, material.uploadedBy]
  );
  return mapMaterial(rows[0]);
}

export async function remove(id) {
  const { rows } = await query("DELETE FROM materials WHERE id = $1 RETURNING *", [id]);
  return mapMaterial(rows[0]);
}

export async function count() {
  const { rows } = await query("SELECT count(*)::int AS count FROM materials");
  return rows[0].count;
}
