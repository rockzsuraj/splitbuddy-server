require('dotenv').config();

module.exports = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'my_database',
  DB_TIMEZONE: process.env.DB_TIMEZONE || '+05:30 ',
  DB_CHARSET: process.env.DB_CHARSET || 'utf8mb4',
DB_COLLATION: process.env.DB_COLLATION || 'utf8mb4_unicode_ci',
  DB_CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT || 10,
  DB_QUEUE_LIMIT: process.env.DB_QUEUE_LIMIT || 0,
  DB_WAIT_FOR_CONNECTIONS: process.env.DB_WAIT_FOR_CONNECTIONS || true,
  DB_DEBUG: process.env.DB_DEBUG === 'true',
  PORT: process.env.PORT || 3000,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_SECRET: process.env.JWT_SECRET  || 'your_jwt_secret',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  EMAIL_PORT: process.env.EMAIL_PORT || 2525,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'your_email_user',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your_email_password',
  EMAIL_FROM: process.env.EMAIL_FROM || 'surajkmr012@gmail.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || ''
};