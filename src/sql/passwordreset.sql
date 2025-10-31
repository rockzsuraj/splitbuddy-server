CREATE TABLE password_resets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  ip_address VARCHAR(45) NULL DEFAULT NULL,
  
  PRIMARY KEY (id),
  INDEX idx_password_resets_token_hash (token_hash),
  INDEX idx_password_resets_user_id (user_id),
  INDEX idx_password_resets_expires_at (expires_at),
  CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;