# Cytology Society of Uganda — Professional Portal

A full-stack CPD (Continuing Professional Development) portal for the Cytology Society of Uganda: a public landing
page, real authentication, and a professional dashboard for submitting, tracking and verifying CPD activity — backed
by a real Express API with persistent storage and file uploads.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS 4 + React Router
- **Backend:** Node/Express, JSON-file storage (no database server to install), JWT auth in an httpOnly cookie,
  file uploads via Multer
- **Dev proxy:** Vite proxies `/api/*` to the backend on port 4310, so both run on one origin during development

## Run locally

```bash
npm install
npm run dev:all
```

This starts the Vite dev server (http://localhost:5173) and the API server (http://localhost:4310) together. Open
http://localhost:5173.

To run them separately:

```bash
npm run server   # API on http://localhost:4310
npm run dev      # frontend on http://localhost:5173
```

### Seeded admin account

On first run the backend seeds one admin account so you can review submissions immediately:

- Email: `admin@csu.ug`
- Password: `Admin@123`

Anyone can self-register a professional account from the landing page.

## Data storage

The backend stores data in `server/data/db.json` (users and CPD submissions) and uploaded certificates in
`server/data/uploads/`. Both are created automatically on first run and are gitignored — delete `server/data` to
reset to a clean seeded state.

## Features

- Public landing page with CSU vision, mission, strategic objectives and positioning statement
- Real registration/login (JWT session cookie, bcrypt password hashing)
- CPD submission form matching the required field set (professional category, licence number, institution,
  designation, activity details, CPD category, points claimed, evidence upload, notes) — professionals only
- Certificate/evidence upload, stored on disk and downloadable only by the owner or an admin
- Live CPD dashboard and history computed from real submitted data (no mock numbers)
- Downloadable CPD completion certificate for verified activities
- Admin "CPD Verification" area to review, verify or reject submitted evidence
- Admin "CPD Materials" library — publish/remove official CPD guidelines and training resources; members browse and
  download them from Resources
- Admin "Member Management" — suspend/reactivate accounts and promote/demote roles, with safeguards (an admin cannot
  suspend or demote themselves, and the last remaining admin cannot be demoted)
- Admin "Compliance Analytics" — membership, submission-status and category breakdowns, and an annual-target
  compliance rate
- Editable professional profile, persisted server-side
- Events page backed by an API endpoint
- Blue / pink / purple / white / black visual theme

## Access control

- Every authenticated request re-checks the account's current role and status against the database (not just the
  JWT), so **suspending a user revokes access immediately** — no waiting for their session to expire.
- CPD activities can only be submitted by `professional` accounts; only `admin` accounts can verify/reject
  submissions, manage members, or publish CPD materials.
- An admin cannot suspend or demote their own account, and the last remaining admin account cannot be demoted —
  prevents accidental lockout.
- Login is throttled after 5 failed attempts per email (5-minute cooldown) to slow down brute-force attempts.
- Evidence files and certificates are only downloadable by the submission's owner or an admin.

## API

All endpoints are under `/api`. Except `/auth/register` and `/auth/login`, all require the session cookie.

- `POST /api/auth/register` / `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`
- `PUT /api/me` — update own profile
- `POST /api/cpd` — submit a CPD activity (professional only, multipart, field name `evidence` for the file)
- `GET /api/cpd` — list your own submissions
- `GET /api/cpd/:id/evidence` — download evidence (owner or admin only)
- `GET /api/cpd/:id/certificate` — printable CPD completion certificate (owner or admin, verified activities only)
- `GET /api/admin/cpd` — list all submissions (admin only)
- `PATCH /api/admin/cpd/:id/verify` — mark `Verified` or `Rejected` (admin only)
- `GET /api/materials` — list published CPD materials
- `GET /api/materials/:id/file` — download a material
- `POST /api/admin/materials` / `DELETE /api/admin/materials/:id` — publish/remove a material (admin only)
- `GET /api/admin/users` — list all accounts (admin only)
- `PATCH /api/admin/users/:id/status` — set `active`/`suspended` (admin only)
- `PATCH /api/admin/users/:id/role` — set `professional`/`admin` (admin only)
- `GET /api/admin/analytics` — membership and compliance statistics (admin only)
- `GET /api/events`

## Production build

```bash
npm run build
npm run preview
```

For a real deployment: move `JWT_SECRET` into an environment variable, put the backend behind HTTPS, set
`CLIENT_ORIGIN`/cookie `secure` appropriately, and consider moving from the JSON-file store to a real database if
concurrent write volume grows.
