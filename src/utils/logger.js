const fs = require('fs');
const path = require('path');
const winston = require('winston');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Ensure logs directory exists (safe for serverless / local)
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.warn('⚠️ Failed to create logs directory:', err.message);
  }
}

// Define log format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Capture stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    // Always log to console (Vercel / AWS Lambda logs read from stdout)
    new winston.transports.Console({
      handleExceptions: true,
    }),

    // Only log to files if not serverless
    ...(process.env.IS_SERVERLESS
      ? []
      : [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            handleExceptions: true,
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
          }),
        ]),
  ],
  exitOnError: false,
});

// Create Morgan-compatible stream
logger.morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
