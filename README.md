# DineOps - Premium POS & Restaurant Management System

DineOps is a comprehensive Restaurant POS, kitchen display, and table-reservation platform built with React, Node.js, Express, PostgreSQL, and Socket.IO. 

This guide provides step-by-step instructions for teammates to set up the exact same environment and database structure on their local machines.

## 🎯 Key Features
- **Real-time POS Terminal:** Floor and table selection, variant-aware cart, and live order syncing.
- **Payment Processing:** Cash, Physical Card, and UPI with live Razorpay Integration.
- **Live Kitchen Sync:** WebSockets push approved/paid orders directly to the Kitchen Dashboard.
- **Table Management & Reservations:** Visual floor plans with live hold/reservation statuses.
- **Admin/Session Controls:** Cash-drawer tracking and dynamic payment capability limits per session.

---

## 1. Prerequisites

Before cloning the repository, ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **PostgreSQL** (v14+ recommended)
- **Git**

*Optional but recommended:*
- **pgAdmin** or **DBeaver** for easy database inspection.

---

## 2. Clone and Install Dependencies

Open your terminal and run:

`ash
# 1. Clone the repository
git clone https://github.com/anmolr2506/DineOps.git
cd DineOps

# 2. Install Backend Dependencies
cd server
npm install

# 3. Install Frontend Dependencies
cd ../client
npm install
`

---

## 3. Environment Variables (.env)

You need to configure the backend environment variables. Create a .env file inside the server/ directory:

`ash
# On Windows (Command Prompt)
cd server
type NUL > .env

# On Mac/Linux
cd server
touch .env
`

Open server/.env and paste the following template. **Update the PG_PASSWORD to match your local PostgreSQL password.**

`env
# Server Config
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Database Credentials
PG_USER=postgres
PG_PASSWORD=your_postgres_password_here
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pos_cafe

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Payment Gateway (Razorpay)
# Ask the project lead for the test/prod keys if you need to test live transactions
RAZORPAY_KEY_ID=rzp_test_SZYe0hBnQVRUKI
RAZORPAY_KEY_SECRET=5HUFL1E3ENW4U4PIGfNaec32

# Email / SMTP Configuration (For password resets)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
`

---

## 4. Database Initialization (Important)

To ensure your local database exactly matches the team's structure (including all new tables for POS, variants, and Razorpay payments), we use automated setup scripts.

From the **project root directory** (DineOps/), run the fresh setup script:

`ash
node server/runSetup.js
`

**What this does:**
1. Connects to the default postgres database.
2. Drops any existing pos_cafe database to ensure a clean slate.
3. Recreates the pos_cafe database.
4. Executes all numbered SQL files located in server/database/ in sequential order.
5. Injects default seed data (admin accounts, default floors, tables, categories, menu items, and variant groups).

*Note: If you already have a database and just pulled new code, you can alternatively run 
node server/updateDB.js to only apply missing migrations without dropping your data. This script now also applies the kitchen display migration, including the `is_prepared` item flag and kitchen order status constraints.*

**Important for Kitchen Display:** the kitchen board is session-based. After logging in, make sure a session is selected before opening `/kitchen`.

---

## 5. Running the Application

You will need two separate terminal windows/tabs to run the stack.

**Terminal 1 (Backend - Node/Express/Socket.IO):**
`ash
cd server
npm run dev
# Server should output: "Server running on port 5000"
`

**Terminal 2 (Frontend - React/Vite):**
`ash
cd client
npm run dev
# Frontend should be accessible at: http://localhost:5173
`

---

## 6. Default Login Credentials

The 
unSetup.js script automatically creates the following default accounts. Use them to log in at http://localhost:5173/login:

- **Admin Account**
  - **Email:** dmin@dineops.com
  - **Password:** dmin123
- **Kitchen Account**
  - **Email:** kitchen@dineops.com
  - **Password:** kitchen123

*(Staff accounts can be created by the Admin via the Users dashboard or via public signup requiring Admin approval).*

---

## 7. Verifying Your Setup

Once logged in as Admin, verify the following to ensure your setup is complete:
1. **Open a Session:** Go to **Sessions**, enter a starting float, and open a new session. Ensure you enable Cash, Card, and UPI.
2. **Terminal:** Navigate to the **Terminal**, select a Floor and Table, and add an item (e.g., Pizza with variants).
3. **Payment:** Click **Finalize & Go To Payment**. Test the dummy Razorpay UI under the UPI section or process a Cash order.
4. **Kitchen Sync:** Open a private browsing window, log in as Kitchen, and verify the paid order appears on the Kitchen Dashboard automatically.
5. **Kitchen Session Switch:** On the Kitchen page, confirm the current session is shown in the header and that you can switch sessions if multiple sessions are active.

---

## 8. Troubleshooting Common Setup Issues

**1. "database pos_cafe is being accessed by other users"**
- *Fix:* Close pgAdmin, DBeaver, or any other SQL query tabs connected to the pos_cafe database. Then re-run 
ode server/runSetup.js.

**2. "password authentication failed for user postgres"**
- *Fix:* Double-check your PG_PASSWORD in server/.env. Verify that the PostgreSQL service is running on your machine.

**3. "Frontend starts but API calls/Login fail"**
- *Fix:* Ensure the background terminal running 
pm run dev in the server folder hasn't crashed. Verify it's running on port 5000.

**4. Kitchen dashboard shows no tickets**
- *Fix:* Confirm you are logged in as `admin` or `kitchen`, and that a session is selected. The kitchen display only loads orders for the active session.

**5. Razorpay checkout window doesn't open**
- *Fix:* Make sure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correctly set in your .env file without quotes.
