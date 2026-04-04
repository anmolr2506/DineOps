const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'pos_cafe',
};

// Safe cast so `undefined` does not crash the driver
if (process.env.PG_PASSWORD) {
    dbConfig.password = String(process.env.PG_PASSWORD);
}

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
