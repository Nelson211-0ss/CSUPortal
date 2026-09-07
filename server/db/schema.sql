-- CSU Professional Portal — Postgres schema.
-- IDs are generated in application code (crypto.randomUUID()), not by the
-- database, so no pgcrypto/uuid-ossp extension is required.

CREATE TABLE IF NOT EXISTS users (
  id                     UUID PRIMARY KEY,
  name                   TEXT NOT NULL,
  email                  TEXT NOT NULL UNIQUE,
  password_hash          TEXT NOT NULL,
  role                   TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('professional', 'admin')),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  professional_category  TEXT NOT NULL DEFAULT '',
  licence_number         TEXT NOT NULL DEFAULT '',
  phone                  TEXT NOT NULL DEFAULT '',
  institution            TEXT NOT NULL DEFAULT '',
  designation            TEXT NOT NULL DEFAULT '',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cpd_submissions (
  id                      UUID PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  email                   TEXT NOT NULL,
  professional_category   TEXT NOT NULL DEFAULT '',
  licence_number          TEXT NOT NULL DEFAULT '',
  phone                   TEXT NOT NULL DEFAULT '',
  institution             TEXT NOT NULL DEFAULT '',
  designation             TEXT NOT NULL DEFAULT '',
  activity_title          TEXT NOT NULL,
  activity_date           TEXT NOT NULL,
  cpd_category            TEXT NOT NULL,
  points_claimed          NUMERIC NOT NULL,
  notes                   TEXT NOT NULL DEFAULT '',
  evidence_file           TEXT,
  evidence_original_name  TEXT,
  status                  TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at             TIMESTAMPTZ,
  verified_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  review_note             TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_cpd_submissions_user_id ON cpd_submissions(user_id);

CREATE TABLE IF NOT EXISTS materials (
  id             UUID PRIMARY KEY,
  title          TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'General',
  description    TEXT NOT NULL DEFAULT '',
  file           TEXT NOT NULL,
  original_name  TEXT,
  uploaded_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id      UUID PRIMARY KEY,
  title   TEXT NOT NULL,
  date    TEXT NOT NULL,
  mode    TEXT NOT NULL DEFAULT '',
  points  INTEGER NOT NULL DEFAULT 0,
  type    TEXT NOT NULL DEFAULT ''
);
