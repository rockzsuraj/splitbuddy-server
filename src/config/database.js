const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Use lazy initialization with valid configuration options
// src/config/database.js
let pool;
let connectionTested = false;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      // Reduce connection limits for serverless
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 5,
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
      // Add connection timeout
      connectTimeout: 10000, // 10 seconds
      // Add query timeout 
      acquireTimeout: 8000
    });
  }
  return pool;
}

async function testConnection() {
  // Skip connection test in serverless environment to avoid cold start issues
  if (process.env.VERCEL) {
    logger.info('⏩ Skipping connection test in serverless environment');
    return true;
  }

  if (connectionTested) {
    return true;
  }

  const currentPool = getPool();
  let connection;
  try {
    connection = await currentPool.getConnection();
    await connection.ping();
    logger.info('✅ Database connection established successfully');
    connectionTested = true;
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    
    // In production, don't crash the app
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// src/config/database.js
const executeQuery = async (sql, params = []) => {
  const pool = getPool();
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    if (conn) conn.release();
  }
};

// Execute transaction (useful for multiple related queries)
async function executeTransaction(queries) {
  const currentPool = getPool();
  let connection;
  try {
    connection = await currentPool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const query of queries) {
      const [rows] = await connection.execute(query.sql, query.params);
      results.push(rows);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Transaction failed:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

function gracefulShutdown() {
  if (!pool) {
    logger.info('No database pool to shutdown');
    return;
  }

  logger.info('Shutting down database pool gracefully...');
  pool.end(err => {
    if (err) {
      logger.error('Error closing database pool:', err);
    } else {
      logger.info('Database pool closed gracefully');
    }
  });
}

// Only add graceful shutdown for local development (not serverless)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = {
  get pool() {
    return getPool();
  },
  testConnection,
  executeQuery,
  executeTransaction,
  gracefulShutdown
};