const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Use lazy initialization with fast timeouts
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
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 5, // Reduced for serverless
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: process.env.DB_CHARSET || 'utf8mb4',
      
      // ✅ Critical: Fast timeouts for serverless
      acquireTimeout: 10000, // 10 seconds max to get connection
      timeout: 10000, // 10 seconds query timeout
      reconnect: false, // Disable auto-reconnect in serverless
      
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
  // Skip connection test in serverless environment
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
      sql: sql.substring(0, 200)
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Remove graceful shutdown for serverless (not needed)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

function gracefulShutdown() {
  if (!pool) return;
  
  logger.info('Shutting down database pool gracefully...');
  pool.end(err => {
    if (err) {
      logger.error('Error closing database pool:', err);
    } else {
      logger.info('Database pool closed gracefully');
    }
  });
}

module.exports = {
  get pool() {
    return getPool();
  },
  testConnection,
  executeQuery,
  gracefulShutdown
};