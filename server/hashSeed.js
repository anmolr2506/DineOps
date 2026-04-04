const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function fix() {
    try {
        const res = await pool.query("SELECT id, password FROM users");
        for (const row of res.rows) {
            if (!row.password.startsWith('$2b$') && !row.password.startsWith('$2a$')) {
                const hashed = await bcrypt.hash(row.password, 10);
                await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, row.id]);
                console.log(`Updated user ${row.id} with hash: ${hashed}`);
            }
        }
        console.log("Done");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
fix();
