# Cytology Society of Uganda — Professional Portal

A full-stack CPD (Continuing Professional Development) portal for the Cytology Society of Uganda: a public landing
page, real authentication, and a professional dashboard for submitting, tracking and verifying CPD activity — backed
by a real Express API with persistent storage and file uploads.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS 4 + React Router
- **Backend:** Node/Express, **PostgreSQL** (via `pg`), JWT auth in an httpOnly cookie, file uploads via Multer
- **Dev proxy:** Vite proxies `/api/*` to the backend on port 4310, so both run on one origin during development

## Run locally

Needs a Postgres instance. The easiest way is the included `docker-compose.yml`:

```bash
docker compose up -d          # Postgres on localhost:5432
cp .env.example .env          # DATABASE_URL already matches docker-compose.yml
npm install
npm run db:migrate            # creates tables and seeds the admin account
npm run dev:all
```

This starts the Vite dev server (http://localhost:5173) and the API server (http://localhost:4310) together. Open
http://localhost:5173.

No Docker? Point `DATABASE_URL` in `.env` at any Postgres 13+ instance (local install or a free-tier managed one —
Neon, Supabase, Railway all work) and run `npm run db:migrate` against it instead.

To run frontend/backend separately:

```bash
npm run server   # API on http://localhost:4310
npm run dev      # frontend on http://localhost:5173
```

### Seeded admin account

`npm run db:migrate` seeds one admin account (only if the `users` table is empty) so you can review submissions
immediately:

- Email: `admin@csu.ug`
- Password: `Admin@123`

Anyone can self-register a professional account from the landing page.

## Data storage

Structured data (users, CPD submissions, materials, events) lives in Postgres — see `server/db/schema.sql` for the
full schema and `server/db/migrate.js` for the migration/seed script (safe to re-run; it only creates what's
missing). Uploaded files (CPD evidence, CPD materials) still live on local disk, under `server/data/uploads/`
(gitignored) — back this directory up separately from the database.

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
- Admin "Member Management" — create new accounts with an assigned role, suspend/reactivate accounts, and
  promote/demote roles, with safeguards (an admin cannot suspend or demote themselves, and the last remaining admin
  cannot be demoted)
- Admin "Compliance Analytics" — membership, submission-status and category breakdowns, and an annual-target
  compliance rate
- Inline preview (PDF/image, before downloading) for CPD materials and CPD evidence
- Profile menu in the top bar (name, email, view profile, log out) instead of a sidebar logout button
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
- Login is throttled after 5 failed attempts per email (5-minute cooldown), plus a general 300-req/15-min rate limit
  across the whole API as defense-in-depth.
- Evidence files and certificates are only downloadable by the submission's owner or an admin.
- `helmet` security headers, `compression`, and `trust proxy` (for correct client IPs/secure cookies behind a reverse
  proxy) are enabled. CSP and the X-Frame-Options header are deliberately relaxed — the API intentionally serves
  file previews and a certificate page meant to be embedded by the frontend, which lives on a different origin.
- The server refuses to start in production without a real `JWT_SECRET` (32+ characters) — no insecure fallback.

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
- `GET /api/materials/:id/file` — download a material (forces download)
- `GET /api/materials/:id/preview` — render a material inline (PDF/image) for in-browser preview
- `POST /api/admin/materials` / `DELETE /api/admin/materials/:id` — publish/remove a material (admin only)
- `GET /api/cpd/:id/evidence/preview` — render CPD evidence inline for in-browser preview (owner or admin only)
- `GET /api/admin/users` — list all accounts (admin only)
- `POST /api/admin/users` — create an account directly with an assigned role (admin only)
- `PATCH /api/admin/users/:id/status` — set `active`/`suspended` (admin only)
- `PATCH /api/admin/users/:id/role` — set `professional`/`admin` (admin only)
- `GET /api/admin/analytics` — membership and compliance statistics (admin only)
- `GET /api/events`

## Deployment: frontend on Vercel, backend on a VPS

The frontend and backend are deployed and run independently, on two different origins. Copy `.env.example` for the
full list of variables — the essentials are below.

### 1. Backend (VPS)

Requires Node 18.18+.

```bash
git clone <your-repo> csu-portal && cd csu-portal
npm ci
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET and CLIENT_ORIGINS at minimum
```

**Database:** either install Postgres on the VPS itself (`apt install postgresql`, create a database/user, point
`DATABASE_URL` at `postgres://user:pass@localhost:5432/csu_portal`) or use a managed provider (Neon, Supabase,
Railway, etc. all have a free tier — just paste the connection string they give you into `DATABASE_URL`, and set
`PGSSL=true` if they require it). Either way, run the migration once before starting the app:

```bash
npm run db:migrate
```

Generate a real secret (do **not** ship the dev default):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run it under a process manager so it survives crashes and reboots:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

Put it behind a reverse proxy that terminates TLS — **this is not optional**: the production cookie config
(`SameSite=None; Secure`) means browsers will silently refuse to send it at all over plain HTTP, so login will
appear to "not stick" until the backend is served over HTTPS.

#### No domain name yet?

You don't need to buy one to get HTTPS working. Free wildcard-DNS services resolve `<your-vps-ip-with-dots-as-dashes>.sslip.io`
straight to that IP with zero DNS setup — e.g. VPS IP `203.0.113.10` → hostname `203-0-113-10.sslip.io`. That's a
real, publicly resolvable hostname, which is all Let's Encrypt needs to issue a valid certificate. (`nip.io` works
the same way, if you prefer.) Use that hostname everywhere this guide says `api.yourdomain.org`, for both
`CLIENT_ORIGINS`/`VITE_API_URL` and the reverse-proxy config below. When you're ready for a permanent setup, buy a
cheap domain (~$10–15/yr from Namecheap, Porkbun, Cloudflare Registrar, etc.), point an A record at the VPS IP, and
swap the hostname — nothing else in the app needs to change.

**Caddy** is the easiest option here — it fetches and renews the certificate automatically, no certbot/cron
needed, and it works with an sslip.io hostname exactly like a real domain:

```caddyfile
# /etc/caddy/Caddyfile — see Caddyfile.example in this repo
203-0-113-10.sslip.io {
    reverse_proxy localhost:4310
}
```

```bash
sudo apt install -y caddy   # or see https://caddyserver.com/docs/install
sudo systemctl reload caddy
```

If you already run nginx, this works too (point `certbot --nginx` at the same hostname):

```nginx
server {
    listen 443 ssl;
    server_name 203-0-113-10.sslip.io;   # or your real domain, once you have one

    ssl_certificate     /etc/letsencrypt/live/203-0-113-10.sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/203-0-113-10.sslip.io/privkey.pem;

    location / {
        proxy_pass http://localhost:4310;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`server/data/uploads/` (the uploaded evidence and materials files) lives outside `dist`/the build output — back it
up (alongside regular Postgres backups), and don't let a redeploy step wipe the VPS working directory.

### 2. Frontend (Vercel)

Import the repo into Vercel — it auto-detects the Vite project (build command `npm run build`, output `dist`).
`vercel.json` in this repo adds the SPA rewrite Vercel needs so client-side routes (`/dashboard`, `/admin/users`, …)
work on direct load/refresh, not just in-app navigation.

In **Project Settings → Environment Variables**, add:

```
VITE_API_URL = https://api.yourdomain.org/api
```

(Vite env vars are baked in at build time — redeploy after changing this.)

### 3. Point them at each other

On the VPS, set `CLIENT_ORIGINS` to your Vercel URL(s), comma-separated if there's more than one (e.g. the
production domain and a custom domain):

```
CLIENT_ORIGINS=https://your-app.vercel.app,https://portal.yourdomain.org
```

**Cookie domain note:** the frontend (Vercel) and backend (VPS) are different registrable domains by default, so the
session cookie must use `SameSite=None; Secure` to survive cross-site requests — this is the production default
already. Some browsers restrict such "third-party" cookies more aggressively over time; if you can, put both
services under the **same** registrable domain instead (e.g. `app.yourdomain.org` on Vercel + `api.yourdomain.org`
on the VPS) and set `COOKIE_SAMESITE=lax` — same-domain cookies aren't subject to those restrictions and it's the
more conventional, defense-in-depth setup.

### Local production dry run

To sanity-check the whole cross-origin setup before deploying:

```bash
VITE_API_URL=http://localhost:4310/api npm run build
npx vite preview --port 4173                                           # frontend, terminal 1
NODE_ENV=production JWT_SECRET=<generated> CLIENT_ORIGINS=http://localhost:4173 DATABASE_URL=<your-db-url> npm run server   # terminal 2
```

Then open http://localhost:4173 — this is the same cross-origin shape as Vercel + VPS, just both on localhost.

## Production checklist

- [ ] `DATABASE_URL` points at a real Postgres instance and `npm run db:migrate` has been run against it
- [ ] `JWT_SECRET` set to a random 32+ character value (the server refuses to start in production without one)
- [ ] `CLIENT_ORIGINS` lists every frontend origin that needs to log in
- [ ] Backend served over HTTPS (required for the session cookie to be sent at all in production)
- [ ] `VITE_API_URL` set in Vercel and the frontend redeployed after any change to it
- [ ] Change the seeded admin password (`admin@csu.ug` / `Admin@123`) immediately after first deploy, or create a
      fresh admin via Member Management and demote/remove the seeded one
- [ ] Both Postgres and `server/data/uploads/` are backed up on a regular schedule
