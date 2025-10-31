USE splitbuddy_db;

-- 1. First drop tables in reverse dependency order if they exist
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS expense_shares;
DROP TABLE IF EXISTS user_expenses;
DROP TABLE IF EXISTS user_group_members;
DROP TABLE IF EXISTS user_groups;

-- 2. Create user_groups with UNSIGNED INT to match users.id
CREATE TABLE user_groups (
   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INT UNSIGNED NOT NULL,  -- Must match users.id type exactly
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- 3. Create group members table with matching types
CREATE TABLE user_group_members (
   INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (, user_id),
  FOREIGN KEY () REFERENCES user_groups() ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Create expenses table with matching types
CREATE TABLE user_expenses (
  expense_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   INT UNSIGNED NOT NULL,
  paid_by INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY () REFERENCES user_groups() ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- 5. Create expense shares table with matching types
CREATE TABLE expense_shares (
  share_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expense_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  share_amount DECIMAL(10,2) NOT NULL,
  is_settled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (expense_id) REFERENCES user_expenses(expense_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 6. Create settlements table with matching types
CREATE TABLE settlements (
  settlement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   INT UNSIGNED NOT NULL,
  from_user INT UNSIGNED NOT NULL,
  to_user INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_paid BOOLEAN DEFAULT FALSE,
  FOREIGN KEY () REFERENCES user_groups(),
  FOREIGN KEY (from_user) REFERENCES users(id),
  FOREIGN KEY (to_user) REFERENCES users(id)
) ENGINE=InnoDB;