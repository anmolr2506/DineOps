# DineOps

Restaurant POS and table-reservation platform built with React, Express, PostgreSQL, and Socket.IO.

This README is written for team onboarding so every teammate can create the exact same database structure and run the app locally.

## 1. Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Git

Optional:
- pgAdmin (easy DB inspection)

## 2. Clone and Install

From project root:

```bash
git clone https://github.com/anmolr2506/DineOps.git
cd DineOps
npm --prefix server install
npm --prefix client install
```

## 3. Environment Setup

Create this file:

```text
server/.env
```

Use this template:

```env
PORT=5000
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pos_cafe
JWT_SECRET=replace_with_a_long_random_secret

# Optional mail configuration (forgot password flow)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Notes:
- Use the exact PG_* names above.
- Keep PG_DATABASE as pos_cafe for consistency with setup scripts.

## 4. Create Exact Database Structure (Fresh Machine)

Run from repository root:

```bash
node server/runSetup.js
```

What this command does:
1. Connects to postgres database.
2. Terminates active connections to pos_cafe.
3. Drops and recreates pos_cafe using [server/database/01_database.sql](server/database/01_database.sql).
4. Executes all numbered SQL files in [server/database](server/database) in ascending order (except 01, which runs first explicitly).

Current ordered SQL pipeline:
1. 01_database.sql
2. 02_users.sql
3. 03_structure.sql
4. 04_products.sql
5. 05_sessions.sql
6. 06_orders.sql
7. 07_payments.sql
8. 08_indexes.sql
9. 09_seed_data.sql
10. 10_dashboard.sql
11. 11_session_management.sql
12. 12_session_admin_controls.sql
13. 13_category_session_isolation.sql
14. 14_menu_variant_groups.sql
15. 15_session_payment_settings.sql
16. 16_floor_plan_session_scope.sql
17. 17_table_reservations.sql

This gives all teammates the same schema, constraints, and seed baseline.

## 5. Migration Path (Existing Local DB)

If a teammate already has an older local database and only needs patch updates:

```bash
node server/updateDB.js
```

Use this only for upgrading an existing DB. For guaranteed identical structure, use step 4 (runSetup).

## 6. Start the Project

Terminal 1 (backend):

```bash
npm --prefix server run dev
```

Terminal 2 (frontend):

```bash
npm --prefix client run dev
```

Open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000

## 7. Seeded Login Accounts

From [server/database/02_users.sql](server/database/02_users.sql):

- Admin
	- Email: admin@dineops.com
	- Password: admin123
- Kitchen
	- Email: kitchen@dineops.com
	- Password: kitchen123

## 8. Verify DB Matches Team Standard

Run these checks in PostgreSQL:

```sql
-- Must return one row: pos_cafe
SELECT datname FROM pg_database WHERE datname = 'pos_cafe';

-- Must include these tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
	AND table_name IN ('users', 'floors', 'tables', 'table_reservations', 'table_holds')
ORDER BY table_name;

-- Optional quick seed checks
SELECT email, role, approval_status FROM users ORDER BY id;
SELECT name FROM floors ORDER BY id;
SELECT floor_id, table_number, seats FROM tables ORDER BY floor_id, table_number;
```

## 9. Production Build Check

```bash
npm --prefix client run build
```

If PowerShell execution policy blocks npm scripts, run with cmd wrapper:

```bash
cmd /c "cd /d D:\path\to\DineOps && npm --prefix client run build"
```

## 10. Common Setup Issues

1. database is being accessed by other users
- Close pgAdmin/query tabs connected to pos_cafe.
- Re-run node server/runSetup.js.

2. authentication failed for user
- Verify PG_USER and PG_PASSWORD in server/.env.
- Ensure PostgreSQL service is running.

3. frontend starts but API calls fail
- Confirm backend is running on PORT from server/.env.
- Confirm client is calling http://localhost:5000.

4. teammate has stale local schema
- Run node server/runSetup.js (preferred for exact parity).

## 11. Team Onboarding Checklist

1. Clone repository.
2. Install server and client dependencies.
3. Create server/.env.
4. Run node server/runSetup.js.
5. Start backend and frontend.
6. Login with seeded admin.
7. Confirm floor/table/reservation data is visible.
