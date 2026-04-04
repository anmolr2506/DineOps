# DineOps

DineOps is a premium restaurant POS system built with the PERN stack.

This guide helps you recreate the project on a new machine and run it without setup/runtime errors.

## 0) Quickstart (Copy/Paste)

Use this fastest path on a fresh system:

```bash
git clone https://github.com/anmolr2506/DineOps.git
cd DineOps
npm --prefix server install
npm --prefix client install
```

Then create `server/.env` using the template in section 3, and run:

```bash
node server/runSetup.js
npm --prefix server run dev
npm --prefix client run dev
```

Open `http://localhost:5173`.

## 1) Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or compatible)
- Git

Optional but recommended:
- pgAdmin for DB inspection

## 2) Clone and Install

Run from your preferred terminal:

git clone https://github.com/anmolr2506/DineOps.git
cd DineOps
npm --prefix server install
npm --prefix client install

## 3) Create Environment File

Create server/.env with the values below adjusted for your system:

PORT=5000
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pos_cafe
JWT_SECRET=replace_with_a_long_random_secret

# Optional SMTP (for forgot-password email)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

Important:
- Use PG_* variable names exactly as shown.
- Do not use DB_* names.

## 4) Database Setup (Fresh Install)

The setup runner recreates the DB schema and executes all numbered SQL files in server/database.

From project root:

node server/runSetup.js

What this does:
- Creates/recreates pos_cafe
- Runs scripts in order (01_*.sql, 02_*.sql, ...)
- Seeds base data and default admin/kitchen users

## 5) Database Migration (Existing Install)

If you already had an older DB and pulled latest code, run:

node server/updateDB.js

This updates users table for approval workflow compatibility:
- Adds approval_status when missing
- Backfills from legacy is_approved
- Makes role nullable for pending users
- Updates role/status constraints

## 6) Run Backend and Frontend

Terminal A (backend):

npm --prefix server run dev

Terminal B (frontend):

npm --prefix client run dev

Open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000

## 7) Build Verification

To validate production build:

npm --prefix client run build

On Windows PowerShell, if execution policy blocks npm scripts, run via cmd:

cmd /c "cd /d D:\path\to\DineOps && npm --prefix client run build"

## 8) Default Seed Accounts

- Admin: admin@dineops.com / admin123
- Kitchen: kitchen@dineops.com / kitchen123

## 9) New Approval Workflow

User onboarding now follows admin approval:

1. New signup creates:
- role = null
- approval_status = pending

2. On login:
- If approval_status is not approved, user is redirected to /waiting

3. Waiting screen:
- Shows pending/rejected state
- Supports manual refresh
- Auto-checks status every few seconds

4. Admin flow:
- Admin opens Approval Requests from Sessions page
- Can approve (with role assignment) or reject pending users

Roles that can be assigned:
- admin
- staff
- kitchen

## 10) Approval APIs

All APIs require JWT. Approval management endpoints require admin role.

- GET /api/users/my-approval-status
- GET /api/users/pending
- GET /api/users/pending/count
- POST /api/users/approve
	- body: { "user_id": number, "role": "admin|staff|kitchen" }
- POST /api/users/reject
	- body: { "user_id": number }

## 11) Common Errors and Fixes

1. Error: database is being accessed by other users
- Close pgAdmin query tabs/connections to pos_cafe and rerun node server/runSetup.js

2. Error: authentication failed for user postgres
- Verify PG_USER and PG_PASSWORD in server/.env
- Confirm PostgreSQL service is running

3. Error: invalid token / unauthorized after login
- Clear local storage token/session and log in again
- Ensure backend is running on the same PORT as configured in frontend API URLs

4. App loads but new users cannot access dashboard
- Expected behavior: new users must be approved by an admin first

5. Port conflict on 5000 or 5173
- Change server PORT in server/.env
- Restart backend/frontend terminals

## 12) Tech Stack

- Frontend: React, React Router, Axios, Tailwind, Socket.IO client, Vite
- Backend: Node.js, Express, PostgreSQL (pg), Socket.IO
- Auth/Security: JWT, bcrypt

## 13) Suggested First Run Checklist

1. Create server/.env
2. Install deps for server and client
3. Run node server/runSetup.js
4. Start backend and frontend
5. Login with seeded admin
6. Create a new user account
7. Approve that user from Approval Requests
8. Login as approved user and continue to sessions/dashboard
