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

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Captures full stack traces
    winston.format.json()
  ),
  defaultMeta: { service: 'SplitBuddy' },
  transports: [
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/rejections.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  ],
  exitOnError: false // Prevents process.exit() after logging exceptions
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}


module.exports = logger;
