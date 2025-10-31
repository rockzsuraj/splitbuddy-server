const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('../config/env');

async function initializeDatabase() {
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    console.log('Database created or already exists');

    // Create tables
    const pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        multipleStatements: true
    });

     await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        image_url VARCHAR(255),
        role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
        verified TINYINT(1) DEFAULT 0,
        status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        refresh_token VARCHAR(255),
        refresh_token_expires_at TIMESTAMP NULL,
        token_signature VARCHAR(255),
        google_id VARCHAR(255) UNIQUE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        group_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        group_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        group_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        group_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

        await pool.query(`
      CREATE TABLE user_group_members (
        group_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES user_groups(group_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

        await pool.query(`
      CREATE TABLE user_expenses (
        expense_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        group_id INT UNSIGNED NOT NULL,
        paid_by INT UNSIGNED NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) NOT NULL,
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES user_groups(group_id) ON DELETE CASCADE,
        FOREIGN KEY (paid_by) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

        await pool.query(`
      CREATE TABLE expense_shares (
        share_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        expense_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        share_amount DECIMAL(10,2) NOT NULL,
        is_settled BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (expense_id) REFERENCES user_expenses(expense_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

            await pool.query(`
      CREATE TABLE settlements (
        settlement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        group_id INT UNSIGNED NOT NULL,
        from_user INT UNSIGNED NOT NULL,
        to_user INT UNSIGNED NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_paid BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (group_id) REFERENCES user_groups(group_id),
        FOREIGN KEY (from_user) REFERENCES users(id),
        FOREIGN KEY (to_user) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);


    console.log('Tables created or already exist');
    await pool.end();
}

initializeDatabase().catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});