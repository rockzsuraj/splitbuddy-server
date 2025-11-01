const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Use lazy initialization with valid configuration options
let pool;
let connectionTested = false;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 5,
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: process.env.DB_CHARSET || 'utf8mb4',      
      // ✅ SSL for Aiven
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false
    });

    // Connection event handlers for debugging
    pool.on('acquire', (connection) => {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Connection acquired');
      }
    });

    pool.on('release', (connection) => {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Connection released');
      }
    });

    pool.on('enqueue', () => {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Waiting for available connection slot');
      }
    });

    pool.on('error', (err) => {
      logger.error('Database pool error:', err);
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

async function executeQuery(sql, params = []) {
  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('SQL:', sql);
    console.log('Params:', params);
  }
  
  const currentPool = getPool();
  let connection;
  try {
    connection = await currentPool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', {
      error: error.message,
      sql: sql.substring(0, 200) // Truncate long queries in logs
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

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