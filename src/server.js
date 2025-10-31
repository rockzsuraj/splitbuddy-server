const knex = require('knex/lib');
const app = require('../app');
const { testConnection } = require('./config/database');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

async function startServer() {
  try {
    await testConnection();
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