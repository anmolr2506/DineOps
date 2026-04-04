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
2. Create a brand new database and name it `dineops`.
3. *(The tables and default data will be generated automatically in the next few steps, no manual queries required!)*

---

### 4. Environment Variables Configuration
In the **`server`** directory, create a new file named `.env`. 
Copy the following structure into it and replace the values with your local machine's context:

```env
# Server Config
PORT=5000

# Database Credentials
DB_USER=postgres
DB_PASSWORD=your_pgadmin_password  # <-- CHANGE THIS TO YOUR LOCAL PG PASSWORD!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dineops

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Email / SMTP Configuration (Ethereal test accounts or actual SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

---

### 5. Initialize & Seed the Database
Once your `.env` file is set up and the `dineops` database exists, run the automated setup script to build your tables and seed the initial users/data:

```bash
cd server
node runSetup.js
```
*If successful, the terminal will log a sequence confirming tables were created and seed data was injected.*

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
