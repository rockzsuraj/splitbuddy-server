const serverless = require('serverless-http');
const app = require('../app');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

// Vercel uses serverless functions, so no app.listen()
// Instead, export a serverless handler

// Test database connection once when the function is initialized
(async () => {
  try {
    await testConnection();
    logger.info('✅ Database connection successful.');
  } catch (err) {
    logger.error('❌ Failed to connect to database:', err);
  }
})();

// Optional: Catch unhandled exceptions for debugging (non-fatal in serverless)
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

// Export the handler for Vercel
module.exports = serverless(app);
