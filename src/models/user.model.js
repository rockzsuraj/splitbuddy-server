
const { executeQuery, pool } = require('../config/database');
const crypto = require('crypto');
const { ApiError } = require('../utils/apiError');
const bcrypt = require('bcryptjs');

class User {

  static async hashPassword(password) {
    const encryptedPassword = await bcrypt.hash(password, 10);
    return encryptedPassword;
  }

  static async create({ username, first_name, last_name, email, password, image_url = '' }) {
    const result = await executeQuery(
      'INSERT INTO users (username, first_name, last_name, email, password, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [username, first_name, last_name, email, password, image_url]
    );
    return result.insertId;
  }

  static async findUserByRefreshToken(refreshToken) {
    const [user] = await executeQuery(
      'SELECT * FROM users WHERE refresh_token = ? AND refreshTokenExpiresAt > NOW()',
      [refreshToken]
    )

    return user;
  }

  static async findByEmail(email) {
    const [users] = await executeQuery(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return users;
  }

  static async findByUsername(username) {
    const users = await executeQuery(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    return users[0];
  }

  static async findById(id) {
    const [users] = await executeQuery(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return users;
  }

  static async findAll() {
    const users = await executeQuery(
      'SELECT * FROM users'
    );
    return users;
  }

  static async updateWithHashedToken(id, refresh_token, tokenSignature) {
    const result = await executeQuery(
      'UPDATE users SET last_login = NOW(), refresh_token = ?, token_signature = ?, refresh_token_expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)  WHERE id = ?',
      [refresh_token, tokenSignature, id]
    );
    return result;
  }

  static async saveResetToken(id, hashedToken, resetToken) {
    const query =
      `INSERT INTO password_resets 
   (user_id, token, token_hash, created_at, expires_at) 
   VALUES (?, ?, ?, 
           CONVERT_TZ(NOW(), @@session.time_zone, '+05:30'), 
           CONVERT_TZ(NOW() + INTERVAL 30 MINUTE, @@session.time_zone, '+05:30'))
   ON DUPLICATE KEY UPDATE
     token = VALUES(token),
     token_hash = VALUES(token_hash),
     created_at = VALUES(created_at),
     expires_at = VALUES(expires_at),
     is_used = FALSE`

    const result = await executeQuery(query, [id, resetToken, hashedToken]);
    return result;
  }

  static async passwordReset(id, token, newPassword) {

    // 1. Find user and valid reset token
    const resetRecord = await executeQuery(
      `SELECT pr.*, u.email 
     FROM password_resets pr
     JOIN users u ON pr.user_id = u.id
     WHERE pr.user_id = ? 
     AND pr.is_used = FALSE
     AND pr.expires_at > NOW()`,
      [id]
    );
    if (resetRecord.length === 0 || resetRecord[0].token !== token) {
      throw new Error('Invalid or expired token');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    console.log('ddd', !crypto.timingSafeEqual(
      Buffer.from(resetRecord[0].token, 'hex'),
      Buffer.from(hashedToken, 'hex')
    ));


    // 3. Compare tokens in constant time (security critical)
    if (!crypto.timingSafeEqual(
      Buffer.from(resetRecord[0].token_hash, 'hex'),
      Buffer.from(hashedToken, 'hex')
    )) {
      throw new ApiError(400, 'Invalid reset token');
    }
    const connection = await pool.getConnection();

    await connection.beginTransaction();

    const newHashedPassword = await User.hashPassword(newPassword)

    // Update user password
    await executeQuery(
      'UPDATE users SET password = ? WHERE id = ?',
      [newHashedPassword, id]
    );

    // Mark token as used
    await executeQuery(
      'UPDATE password_resets SET is_used = TRUE WHERE id = ?',
      [resetRecord[0].id]
    );

    await connection.commit();

    return { success: true, message: 'Password updated successfully' };
  }

  static async logOutUser(id) {
    const connection =
      await executeQuery(
        'UPDATE users SET refresh_token = null, refresh_token_expired_at = null, token_signature = null where id = ?',
        [id]
      )
  }

  // Store refresh token in DB
  static async storeRefreshToken(userId, refreshTokenHash) {
    const connection = await pool.getConnection();
    const res = await connection.query(
      'UPDATE users SET refresh_token = ?, refresh_token_expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id = ?',
      [refreshTokenHash, userId]
    );

    return res;
  }

  static async findUserByGoogleId(googleID) {
    const [user] = await executeQuery(
      'SELECT * FROM users WHERE google_id = ? LIMIT 1',
      [googleID]);
      console.log('google user', user);
      
    return user;
  }

  static async saveUserGoogle(sub, email, first_name, last_name, picture, email_verified) {
    const username = email.split('@')[0];
    await executeQuery(
      'INSERT INTO users (google_id, username, email, first_name, last_name, image_url, verified, password) VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
      [sub, username, email, first_name, last_name, picture, email_verified, '[google-auth]']
    )
    const user = await User.findUserByGoogleId(sub);
    return user;
  }

  static async deleteUserInDB(id) {
    await executeQuery('DELETE FROM users where id = ?', [id])
  }

  static async dynamicQueryUpdate(updateParams, setClause) {
    const result = await executeQuery(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      updateParams
    );
    return result;
  }
  // Add more methods as needed
}

module.exports = User;