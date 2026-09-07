# Cytology Society of Uganda — Professional Portal

A full-stack CPD (Continuing Professional Development) portal for the Cytology Society of Uganda: a public landing
page, real authentication, and a professional dashboard for submitting, tracking and verifying CPD activity — backed
by a real Express API with persistent storage and file uploads.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS 4 + React Router
- **Backend:** Node/Express, JSON-file storage (no database server to install), JWT auth in an httpOnly cookie,
  file uploads via Multer
- **Dev proxy:** Vite proxies `/api/*` to the backend on port 3001, so both run on one origin during development

## Run locally

```bash
npm install
npm run dev:all
```

This starts the Vite dev server (http://localhost:5173) and the API server (http://localhost:3001) together. Open
http://localhost:5173.

To run them separately:

```bash
npm run server   # API on http://localhost:3001
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
  designation, activity details, CPD category, points claimed, evidence upload, notes)
- Certificate/evidence upload, stored on disk and downloadable only by the owner or an admin
- Live CPD dashboard and history computed from real submitted data (no mock numbers)
- Admin "CPD Verification" area to review, verify or reject submitted evidence
- Editable professional profile, persisted server-side
- Events and resources pages backed by API endpoints
- Blue / pink / purple / white / black visual theme

## API

All endpoints are under `/api`. Except `/auth/register` and `/auth/login`, all require the session cookie.

- `POST /api/auth/register` / `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`
- `PUT /api/me` — update own profile
- `POST /api/cpd` — submit a CPD activity (multipart, field name `evidence` for the file)
- `GET /api/cpd` — list your own submissions
- `GET /api/cpd/:id/evidence` — download evidence (owner or admin only)
- `GET /api/admin/cpd` — list all submissions (admin only)
- `PATCH /api/admin/cpd/:id/verify` — mark `Verified` or `Rejected` (admin only)
- `GET /api/events`, `GET /api/resources`

## Production build

```bash
npm run build
npm run preview
```

For a real deployment: move `JWT_SECRET` into an environment variable, put the backend behind HTTPS, set
`CLIENT_ORIGIN`/cookie `secure` appropriately, and consider moving from the JSON-file store to a real database if
concurrent write volume grows.
