const path = require('path');
const winston = require('winston');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Detect if running in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless =
  process.env.VERCEL === '1' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.IS_SERVERLESS === 'true';

// Define log format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [
  new winston.transports.Console({
    handleExceptions: true,
  }),
];

// Only use file-based logging when not serverless
if (!isServerless) {
  const fs = require('fs');
  const logDir = path.join(__dirname, '../logs');

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        handleExceptions: true,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
      })
    );
  } catch (err) {
    console.warn('⚠️ Could not create or access logs directory:', err.message);
  }
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isServerless ? json() : combine(colorize(), devFormat)
  ),
  transports,
  exitOnError: false,
});

// Morgan-compatible stream
logger.morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
