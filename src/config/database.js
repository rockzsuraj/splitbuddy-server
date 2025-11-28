// ...existing code...
/*
  DB wrapper: prefer @neondatabase/serverless.createPool if available,
  otherwise fall back to pg.Pool for local testing.
*/
const debug = require('debug')('app:db');
let pool;

function initPool() {
  if (pool) return pool;
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

  // try neondatabase/serverless first
  try {
    const neon = require('@neondatabase/serverless');
    if (neon && typeof neon.createPool === 'function') {
      pool = neon.createPool(DATABASE_URL);
      debug('Using @neondatabase/serverless pool');
      return pool;
    }
    debug('@neondatabase/serverless present but createPool not found, falling back to pg');
  } catch (e) {
    debug('No @neondatabase/serverless available, falling back to pg:', e.message);
  }

  // fallback to pg Pool
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: DATABASE_URL,
    // tune as needed
    max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  debug('Using pg.Pool');
  return pool;
}

// convert MySQL-style '?' placeholders to Postgres $1, $2, ...
function convertPlaceholders(sql) {
  if (!sql || typeof sql !== 'string') return sql;
  // remove MySQL backticks
  let cleaned = sql.replace(/`/g, '');
  let i = 0;
  cleaned = cleaned.replace(/\?/g, () => `$${++i}`);
  return cleaned;
}

async function executeQuery(sql, params = []) {
  const poolInstance = initPool();
  const pgSql = convertPlaceholders(sql);

  // handle both pool.query and pool.connect APIs
  if (typeof poolInstance.query === 'function') {
    // pool.query works for both neon and pg
    return poolInstance.query(pgSql, params);
  } else {
    // defensive: try connect/release
    const client = await poolInstance.connect();
    try {
      return await client.query(pgSql, params);
    } finally {
      try { client.release(); } catch (_) {}
    }
  }
}

async function testConnection() {
  const poolInstance = initPool();
  // Try to run a lightweight query to verify the connection
  try {
    if (typeof poolInstance.query === 'function') {
      await poolInstance.query('SELECT 1');
    } else {
      const client = await poolInstance.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        try { client.release(); } catch (_) {}
      }
    }
    debug('Database connection OK');
    return true;
  } catch (err) {
    debug('Database connection failed:', err);
    throw err;
  }
}

module.exports = {
  initPool,
  executeQuery,
  convertPlaceholders,
  testConnection,
  pool
};