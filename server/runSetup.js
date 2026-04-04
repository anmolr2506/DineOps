const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const run = async () => {
    // 1. Connect to default postgres to create database
    const client1 = new Client({
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: 'postgres'
    });

    console.log("Connecting to default 'postgres' database...");
    await client1.connect();

    console.log("Running 01_database.sql...");
    const dbSql = fs.readFileSync(path.join(__dirname, 'database', '01_database.sql'), 'utf-8');
    const statements = dbSql.split(';').filter(s => s.trim().length > 0);
    for (const stmt of statements) {
        await client1.query(stmt);
    }

    await client1.end();
    console.log("Database 'pos_cafe' created successfully.");

    // 2. Connect to the newly created database pos_cafe
    const client2 = new Client({
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: process.env.PG_DATABASE
    });

    console.log("Connecting to 'pos_cafe' database...");
    await client2.connect();

    const scripts = [
        '02_users.sql',
        '03_structure.sql',
        '04_products.sql',
        '05_sessions.sql',
        '06_orders.sql',
        '07_payments.sql',
        '08_indexes.sql',
        '09_seed_data.sql'
    ];

    for (const script of scripts) {
        console.log(`Running ${script}...`);
        const sql = fs.readFileSync(path.join(__dirname, 'database', script), 'utf-8');
        try {
            await client2.query(sql);
        } catch (err) {
            console.error(`Error executing ${script}:`, err);
            throw err;
        }
    }

    console.log("All setup scripts executed successfully!");
    await client2.end();
};

run().catch(err => {
    console.error("Execution failed:", err);
    process.exit(1);
});
