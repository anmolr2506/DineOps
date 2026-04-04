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

        await pool.query(`
            CREATE TABLE IF NOT EXISTS table_reservations (
                id SERIAL PRIMARY KEY,
                table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
                customer_name VARCHAR(120) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                reservation_start TIMESTAMP NOT NULL,
                reservation_end TIMESTAMP NOT NULL,
                guests INT NOT NULL CHECK (guests > 0),
                status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_reservation_status CHECK (status IN ('confirmed', 'cancelled')),
                CONSTRAINT chk_reservation_window CHECK (reservation_end > reservation_start)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS table_holds (
                id SERIAL PRIMARY KEY,
                table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
                hold_token VARCHAR(120) NOT NULL UNIQUE,
                slot_start TIMESTAMP NOT NULL,
                slot_end TIMESTAMP NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_hold_window CHECK (slot_end > slot_start)
            );
        `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_table_reservations_slot ON table_reservations (table_id, reservation_start, reservation_end, status);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_table_holds_slot ON table_holds (table_id, slot_start, slot_end, expires_at);`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                phone VARCHAR(20) NOT NULL UNIQUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_item_variants (
                id SERIAL PRIMARY KEY,
                order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
                variant_value_id INT NOT NULL REFERENCES variant_group_values(id) ON DELETE CASCADE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (order_item_id, variant_value_id)
            );
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_item_variants_order_item ON order_item_variants (order_item_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_item_variants_value ON order_item_variants (variant_value_id);`);

                console.log("Successfully updated users, floors, and tables schema for approval workflow and global floor plans.");
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        await pool.end();
    }
}

updateDB();
