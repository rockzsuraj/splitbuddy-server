const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = require("./src/config/env");

require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT || 3306
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};