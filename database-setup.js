// database-setup.js
const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function setupDatabase() {
  try {
    // Drop existing tables if they exist
    await db.schema.dropTableIfExists('user_sessions');
    await db.schema.dropTableIfExists('password_resets');
    await db.schema.dropTableIfExists('users');
    
    // Run migrations
    await db.migrate.latest();
    console.log('Database reset and migrations run successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

setupDatabase();