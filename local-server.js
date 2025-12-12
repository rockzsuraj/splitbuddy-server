const knex = require('knex/lib');
const app = require('./app');
const { testConnection, initPool } = require('./src/config/database');
const { PORT } = require('./src/config/env');
const logger = require('./src/utils/logger');
const redisClient = require('./src/config/redisClient');

async function startServer() {
  try {
    await redisClient.connectRedis();   // will log error but NOT crash on timeout
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
        logger.error('Failed to connect to database');
        process.exit(1);
    }
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

startServer();