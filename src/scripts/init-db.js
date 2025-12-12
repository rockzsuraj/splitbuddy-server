require('dotenv').config();
const { Pool } = require('pg');

const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  refresh_token VARCHAR(255),
  refresh_token_expires_at TIMESTAMPTZ,
  token_signature VARCHAR(255),
  google_id VARCHAR(255) UNIQUE
);
`;

const CREATE_USER_GROUPS_TABLE = `
CREATE TABLE IF NOT EXISTS user_groups (
  group_id SERIAL PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INT NOT NULL REFERENCES users(id),
  group_icon VARCHAR(100) DEFAULT 'others',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
`;

const CREATE_USER_GROUP_MEMBERS_TABLE = `
CREATE TABLE IF NOT EXISTS user_group_members (
  group_id INT NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);
`;

const CREATE_USER_EXPENSES_TABLE = `
CREATE TABLE IF NOT EXISTS user_expenses (
  expense_id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  paid_by INT NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
`;

const CREATE_EXPENSE_SHARES_TABLE = `
CREATE TABLE IF NOT EXISTS expense_shares (
  share_id SERIAL PRIMARY KEY,
  expense_id INT NOT NULL REFERENCES user_expenses(expense_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id),
  share_amount NUMERIC(10,2) NOT NULL,
  is_settled BOOLEAN DEFAULT FALSE
);
`;

const CREATE_SETTLEMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS settlements (
  settlement_id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES user_groups(group_id),
  from_user INT NOT NULL REFERENCES users(id),
  to_user INT NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  settled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_paid BOOLEAN DEFAULT FALSE
);
`;

async function initializeDatabase() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set. Please provide a Postgres connection string.');
    }

    const pool = new Pool({ connectionString });

    try {
        // await pool.query(CREATE_USERS_TABLE);
        await pool.query(CREATE_USER_GROUPS_TABLE);
        await pool.query(CREATE_USER_GROUP_MEMBERS_TABLE);
        await pool.query(CREATE_USER_EXPENSES_TABLE);
        await pool.query(CREATE_EXPENSE_SHARES_TABLE);
        await pool.query(CREATE_SETTLEMENTS_TABLE);

        console.log('Tables created or already exist');
    } finally {
        await pool.end();
    }
}

initializeDatabase().catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});