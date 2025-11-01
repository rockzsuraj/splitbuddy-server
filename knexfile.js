// ...existing code...
require('dotenv').config();
const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = require("./src/config/env");

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: DB_HOST || '127.0.0.1',
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT || 5432,
      // enable ssl when explicitly requested (useful for Neon)
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      min: 0,
      max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 5
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 0,
      max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  }
};