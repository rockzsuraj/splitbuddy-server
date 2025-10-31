const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_TIMEZONE, DB_CHARSET, DB_QUEUE_LIMIT,   } = require('./env');
const logger = require('../utils/logger'); // Assuming you have a logger utility

// Create connection pool with additional production-ready settings
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT || 3306,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your application needs
  queueLimit: DB_QUEUE_LIMIT || 0, // 0 means unlimited
  enableKeepAlive: true, // Important for production
  keepAliveInitialDelay: 0,
  timezone: DB_TIMEZONE, // Set your preferred timezone
  charset: DB_CHARSET // Supports full Unicode including emojis
});

// Enhanced connection test function
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping(); // More reliable than just getting a connection
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error; // Re-throw to handle at application level
  } finally {
    if (connection) connection.release();
  }
}

// Enhanced query executor with error handling
async function executeQuery(sql, params = []) {
  console.log('sql:', sql);
  console.log('params:', params);
  
  
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', {
      sql: sql,
      params: params,
      error: error.message
    });
    throw error; // Re-throw for controller to handle
  } finally {
    if (connection) connection.release();
  }
}

// Graceful shutdown handler
function gracefulShutdown() {
  pool.end(err => {
    if (err) {
      logger.error('Error closing database pool:', err);
      process.exit(1);
    }
    logger.info('Database pool closed gracefully');
    process.exit(0);
  });
}

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  pool,
  testConnection,
  executeQuery,
  gracefulShutdown
};