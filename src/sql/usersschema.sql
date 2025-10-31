CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username CHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP NULL DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  remember_token VARCHAR(100) NULL DEFAULT NULL,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  last_login_ip VARCHAR(45) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'pending',
  
  PRIMARY KEY (id),
  UNIQUE INDEX idx_users_email_unique (email),
  UNIQUE INDEX idx_users_uuid_unique (uuid),
  INDEX idx_users_status (status),
  INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;