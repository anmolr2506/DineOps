const pool = require('./config/db');

async function updateDB() {
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20);`);
        await pool.query(`UPDATE users SET approval_status = CASE WHEN is_approved = TRUE THEN 'approved' ELSE 'pending' END WHERE approval_status IS NULL;`);
        await pool.query(`ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending';`);
        await pool.query(`ALTER TABLE users ALTER COLUMN approval_status SET NOT NULL;`);
        await pool.query(`ALTER TABLE users ALTER COLUMN role DROP NOT NULL;`);

        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_role;`);
        await pool.query(`ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('admin', 'staff', 'kitchen') OR role IS NULL);`);
        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_approval_status;`);
        await pool.query(`ALTER TABLE users ADD CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected'));`);

        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry BIGINT;`);
        console.log("Successfully updated users table schema for approval workflow and password resets.");
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        await pool.end();
    }
}

updateDB();
