const { Pool } = require('pg');
const { executeQueryWithLogging } = require('./query-logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function executeQuery(query, params = []) {
    return executeQueryWithLogging(async (q, p) => {
        return await pool.query(q, p);
    }, query, params);
}

async function initPool() {
    try {
        await pool.connect();
        console.log('Database connected');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connection test successful');
        return true;
    } catch (err) {
        console.error('❌ Database connection test failed:', err);
        return false;
    }
}

module.exports = { executeQuery, initPool, testConnection };