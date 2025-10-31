const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Use lazy initialization to prevent cold start timeouts
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
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: process.env.DB_CHARSET || 'utf8mb4',
      
      // ✅ SSL for Aiven
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false
    });

    // Connection event handlers
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

    pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });
  }
  return pool;
}

async function testConnection() {
  // If we've already tested, return cached result
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
    
    if (process.env.NODE_ENV === 'production') {
      return false; // Don't crash in production
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function executeQuery(sql, params = []) {
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
      sql: sql.substring(0, 200) // Truncate long queries
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

function gracefulShutdown() {
  if (!pool) {
    logger.info('No database pool to shutdown');
    process.exit(0);
    return;
  }

  logger.info('Shutting down database pool gracefully...');
  pool.end(err => {
    if (err) {
      logger.error('Error closing database pool:', err);
      process.exit(1);
    }
    logger.info('Database pool closed gracefully');
    process.exit(0);
  });
}

// Handle process termination (useful for local development)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Export with getter for pool to maintain backward compatibility
module.exports = {
  get pool() {
    return getPool();
  },
  testConnection,
  executeQuery,
  gracefulShutdown
};