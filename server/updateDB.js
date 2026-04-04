const pool = require('./config/db');

async function updateDB() {
    try {
        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_role;`);
        await pool.query(`ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('admin', 'staff', 'kitchen'));`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry BIGINT;`);
        console.log("Successfully updated users table schema for Kitchen role and password resets.");
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        await pool.end();
    }
}

updateDB();
