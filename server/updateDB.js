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

        await pool.query(`ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_session_id_fkey;`);
        await pool.query(`ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_session_id_fkey;`);

        await pool.query(`ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_name_key;`);
        await pool.query(`ALTER TABLE floors DROP CONSTRAINT IF EXISTS unique_floor_name_per_session;`);
                await pool.query(`ALTER TABLE floors ADD CONSTRAINT floors_name_key UNIQUE (name);`);

        await pool.query(`ALTER TABLE tables DROP CONSTRAINT IF EXISTS unique_table_per_floor;`);
        await pool.query(`ALTER TABLE tables DROP CONSTRAINT IF EXISTS unique_table_per_floor_session;`);
                await pool.query(`ALTER TABLE tables ADD CONSTRAINT unique_table_per_floor UNIQUE (floor_id, table_number);`);

        await pool.query(`ALTER TABLE floors DROP COLUMN IF EXISTS session_id;`);
        await pool.query(`ALTER TABLE tables DROP COLUMN IF EXISTS session_id;`);

                console.log("Successfully updated users, floors, and tables schema for approval workflow and global floor plans.");
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        await pool.end();
    }
}

updateDB();
