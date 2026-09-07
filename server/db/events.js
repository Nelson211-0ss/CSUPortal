import { query } from "./pool.js";

function mapEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    mode: row.mode,
    points: row.points,
    type: row.type,
  };
}

export async function list() {
  const { rows } = await query("SELECT * FROM events ORDER BY date ASC");
  return rows.map(mapEvent);
}
