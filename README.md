# DineOps Setup Guide (New PC)

This README is the complete setup guide to run DineOps on a different machine from scratch.

## 1. Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- Database: PostgreSQL

## 2. Prerequisites

Install these first:

- Node.js 18+ (LTS recommended)
- npm (ships with Node)
- PostgreSQL 14+ (or compatible)
- Git

Optional tools:

- pgAdmin or DBeaver (for DB inspection)

## 3. Clone Repository

```bash
git clone <your-repo-url>
cd dineops
```

## 4. Install Dependencies

Install dependencies in both server and client folders.

```bash
cd server
npm install

cd ../client
npm install

cd ..
```

## 5. Create Environment File

Create this file:

- `server/.env`

Use this template:

```env
# Server
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SERVER_ORIGIN=http://localhost:5000

# PostgreSQL
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pos_cafe

# Auth
JWT_SECRET=replace_with_a_long_random_secret

# Razorpay (required for gateway checkout flows)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (optional: used by forgot/reset password)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="DineOps <noreply@dineops.com>"

# Optional image seeding config (used only by seedMenuImages script)
MENU_IMAGE_PROVIDER_URL=
MENU_IMAGE_API_KEY=
MENU_IMAGE_MODEL=
```

Notes:

- `PG_DATABASE` should remain `pos_cafe` for default SQL/setup scripts.
- If SMTP values are empty, password reset falls back to a test email transport.
- Never commit real secrets to git.

## 6. Initialize Database (Fresh Machine)

From project root:

```bash
node server/runSetup.js
```

What this script does:

1. Connects to the default `postgres` database.
2. Drops and recreates `pos_cafe`.
3. Runs all numbered SQL files in `server/database` (except `01_database.sql` which is handled first).
4. Seeds base data (users, floors, tables, categories, products, etc.).

Important:

- This is destructive for `pos_cafe` (it recreates it).
- Close DB tools (pgAdmin/DBeaver/query tabs) if drop fails due to active connections.

## 7. Update Existing Database (Non-Destructive Path)

If you already have data and only want schema updates:

```bash
node server/updateDB.js
```

This applies compatibility updates and kitchen-related migration logic without recreating the full DB.

## 8. Run Backend and Frontend

Use two terminals.

Terminal A (backend):

```bash
cd server
npm run dev
```

Expected output includes:

- `Server running on port 5000`

Terminal B (frontend):

```bash
cd client
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health text: `http://localhost:5000/`

## 9. First Login / Seeded Users

Seeded SQL creates these users:

- `admin@dineops.com` (role: admin)
- `kitchen@dineops.com` (role: kitchen)

If you do not have the plain-text password for your environment, reset password directly in DB.

Example reset flow:

1. Generate bcrypt hash from `server` folder:

```bash
node -e "const b=require('bcrypt');b.hash('NewStrongPass123',10).then(h=>console.log(h))"
```

2. Update user password in PostgreSQL (`psql` example):

```sql
UPDATE users
SET password = '<paste_generated_hash>'
WHERE email = 'admin@dineops.com';
```

Then log in with the new password.

## 10. Quick Post-Setup Verification

After login, verify core flows:

1. Create/open a session from Sessions page.
2. Open Terminal page, place an order on a table.
3. Complete payment (method availability depends on session config).
4. Confirm order appears on Kitchen dashboard in real time.
5. Open customer QR flow and verify menu/order/tracking pages load.

## 11. Common Issues and Fixes

1. Database drop fails (`pos_cafe is being accessed by other users`)

- Close DB clients and re-run `node server/runSetup.js`.

2. Postgres auth error (`password authentication failed for user postgres`)

- Verify `PG_USER`, `PG_PASSWORD`, host/port in `server/.env`.
- Ensure PostgreSQL service is running.

3. Frontend loads but API calls fail

- Confirm backend is running on port `5000`.
- Check `CLIENT_ORIGIN` and CORS-related values.

4. Login fails with JWT error

- Ensure `JWT_SECRET` exists in `server/.env`.
- Restart backend after editing env.

5. Razorpay errors

- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- Ensure keys match your intended environment (test vs live).

6. PowerShell blocks npm scripts on Windows

- Use Command Prompt, Git Bash, or run through:

```powershell
cmd /c npm run dev
```

## 12. Useful Commands

From `server`:

```bash
npm run dev
npm start
npm run seed:review
npm run seed:judge
npm run seed:menu-showcase
npm run seed:menu-images
```

From `client`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
