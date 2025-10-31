exports.up = async function(knex) {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable();
    table.string('email', 100).notNullable();
    table.string('password', 255).notNullable();
    table.string('first_name', 50).notNullable();
    table.string('last_name', 50).notNullable();
    table.string('image_url', 255).defaultTo('');
    table.enum('role', ['user', 'admin', 'moderator']).defaultTo('user');
    table.boolean('verified').defaultTo(false);
    table.enum('status', ['active', 'suspended', 'pending']).defaultTo('active');
    table.timestamp('last_login').nullable();
    table.timestamps(true, true);
  });

  // Add constraints to users table (run separately for MySQL)
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT uc_username UNIQUE (username)
  `);
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT uc_email UNIQUE (email)
  `);
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_username_length CHECK (CHAR_LENGTH(username) >= 3)
  `);
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT chk_password_length CHECK (CHAR_LENGTH(password) >= 8)
  `);

  // Create indexes on users table
  await knex.raw(`CREATE INDEX idx_users_status ON users(status)`);
  await knex.raw(`CREATE INDEX idx_users_created_at ON users(created_at)`);

  // Create password_resets table
  await knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('token', 255).notNullable().unique();
    table.datetime('expires_at').notNullable();
    table.timestamps(true, true);
  });

  // Create user_sessions table
  await knex.schema.createTable('user_sessions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('session_token', 255).notNullable().unique();
    table.string('ip_address', 45);
    table.datetime('expires_at').notNullable();
    table.timestamps(true, true);
  });

  // Add indexes to password_resets table
  await knex.schema.alterTable('password_resets', (table) => {
    table.index('user_id', 'idx_password_resets_user_id');
    table.index('expires_at', 'idx_password_resets_expires_at');
  });

  // Add indexes to user_sessions table
  await knex.schema.alterTable('user_sessions', (table) => {
    table.index('user_id', 'idx_user_sessions_user_id');
    table.index('expires_at', 'idx_user_sessions_expires_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_sessions');
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('users');
};
