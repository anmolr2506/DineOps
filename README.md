# DineOps - Intelligence POS Solution 🍽️

DineOps is a premium, cinematic-themed Restaurant Point of Sale (POS) and operations management platform. It features robust role-based access control (Admin, Staff, Kitchen), seamless authentication flows, and a breathtaking cinematic UI.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (pgAdmin recommended)
- Git

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/anmolr2506/DineOps.git
cd DineOps
```

### 2. Install Dependencies
You need to install dependencies for **both** the client and server separately.

**For the Backend Server:**
```bash
cd server
npm install
```

**For the Frontend Client:**
```bash
cd ../client
npm install
```

---

### 3. Database Setup (PostgreSQL)
1. Open pgAdmin (or your preferred Postgres CLI).
2. Create a brand new database and name it `pos_cafe`.
3. *(The tables and default data will be generated automatically in the next few steps, no manual queries required!)*

---

### 4. Environment Variables Configuration
In the **`server`** directory, create a new file named `.env`. 
Copy the following structure into it and replace the values with your local machine's context:

```env
# Server Config
PORT=5000

# Database Credentials
PG_USER=postgres
PG_PASSWORD=your_pgadmin_password  # <-- CHANGE THIS TO YOUR LOCAL PG PASSWORD!
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pos_cafe

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Email / SMTP Configuration (Ethereal test accounts or actual SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

⚠️ **Important:** Use `PG_USER`, `PG_PASSWORD`, `PG_HOST`, `PG_PORT`, and `PG_DATABASE` as the variable names (not `DB_*`). The application code expects these specific names.

---

### 5. Initialize & Seed the Database
Once your `.env` file is set up and the `pos_cafe` database exists, run the automated setup script to build your tables and seed the initial users/data:

```bash
cd server
node runSetup.js
```
*If successful, the terminal will log a sequence confirming tables were created and seed data was injected.*

`runSetup.js` now automatically runs every numbered SQL file in `server/database` in order, so new scripts such as `10_dashboard.sql` are picked up without changing the setup runner again.

If you want to rebuild the demo data after the schema already exists, you can also run the separate reset helper:

```bash
cd server
psql -d pos_cafe -f database/reset_and_seed.sql
```
This script clears transactional data, reseeds the sample orders and payments, and refreshes the dashboard materialized views.

---

### 6. Run the Application
You will need to run the application using two separate terminal windows.

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Note: If 'npm run dev' doesn't exist in package.json, just use 'node server.js'
```

**Terminal 2 (Frontend React App):**
```bash
cd client
npm run dev 
# Note: If using Create React App, use 'npm start'
```

The app will now be running on `http://localhost:5173` (or 3000 depending on Vite/CRA).

---

## 🔑 Default Seeded Accounts
You can immediately log in using the following seeded credentials:
- **Admin Access:** `admin@dineops.com` / `admin123`
- **Kitchen Access:** `kitchen@dineops.com` / `kitchen123`

---

## 💻 Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (pg)
- **Security:** bcrypt (hashing), jsonwebtoken (auth), nodemailer (email service)

---

## 🛠️ Troubleshooting

### Issue 1: `runSetup.js` fails with "error: database is being accessed by other users"
**Cause:** There are active connections to the `pos_cafe` database preventing it from being dropped and recreated.

**Solution:**
- The `runSetup.js` script now automatically terminates all existing connections before setting up the database.
- If you still get this error, close any pgAdmin connections or database clients pointing to `pos_cafe` and try again.

---

### Issue 2: Environment variables not recognized / Connection fails
**Cause:** Incorrect `.env` variable names. The code expects `PG_*` variables, not `DB_*`.

**Solution:**
Ensure your `.env` file uses these exact variable names:
```env
PG_USER=postgres
PG_PASSWORD=your_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pos_cafe
```

❌ **Do NOT use:** `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`

---

### Issue 3: `runSetup.js` fails to execute
**Solution:**
- Make sure you're in the `server` directory: `cd server`
- Verify Node.js is installed: `node --version`
- Verify PostgreSQL is running and accessible
- Check that your `.env` file is in the `server` directory
- If you still have issues, manually create the `pos_cafe` database in pgAdmin first, then run `node runSetup.js`

---

### Issue 4: Port 5000 already in use
**Cause:** Another application is using port 5000.

**Solution:**
Update the `PORT` variable in your `.env` file to a different port (e.g., 5001, 5002) or kill the process using port 5000.
