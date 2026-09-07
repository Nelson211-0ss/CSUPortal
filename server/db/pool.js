import pg from "pg";

const { Pool, types } = pg;

// node-postgres returns NUMERIC columns as strings by default (to avoid silent
// precision loss); this app only ever stores small point values as numbers,
// so parse them back to JS numbers to match the previous JSON-store behavior.
const NUMERIC_OID = 1700;
types.setTypeParser(NUMERIC_OID, (value) => (value === null ? null : parseFloat(value)));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres instance " +
      "(e.g. postgres://user:pass@localhost:5432/csu_portal)."
  );
}

// Managed Postgres providers (Render, Railway, Supabase, etc.) commonly need
// SSL but present a cert chain the default Node trust store won't validate;
// set PGSSL=true to accept that instead of failing every connection.
const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

export function query(text, params) {
  return pool.query(text, params);
}
