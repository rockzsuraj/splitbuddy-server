// ...existing code...
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
    // Postgres: use $1, $2, ... placeholders + RETURNING id
    const result = await executeQuery(
      `INSERT INTO users (username, first_name, last_name, email, password, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [username, first_name, last_name, email, password, image_url]
    );
    console.log('result', result);
    

    return result;
  }

  static async findUserByRefreshToken(refreshToken) {
    const {rows} = await executeQuery(
      `SELECT * FROM users 
       WHERE refresh_token = $1 
       AND refresh_token_expires_at > NOW()`,
      [refreshToken]
    );
    return rows?.[0];
  }

  static async findByEmail(email) {
    const {rows} = await executeQuery(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return rows?.[0];
  }

  static async findByUsername(username) {
    const {rows} = await executeQuery(
      `SELECT * FROM users WHERE username = $1 LIMIT 1`,
      [username]
    );
    return rows?.[0];
  }

  static async findById(id) {
    const {rows} = await executeQuery(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows?.[0];
  }

  static async findAll() {
    const {rows} = await executeQuery(`SELECT * FROM users`);
    return rows;
  }

  static async updateWithHashedToken(id, refresh_token, tokenSignature) {
    const result = await executeQuery(
      `UPDATE users 
       SET last_login = NOW(), 
           refresh_token = $1, 
           token_signature = $2, 
           refresh_token_expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $3`,
      [refresh_token, tokenSignature, id]
    );
    return result;
  }

  static async saveResetToken(id, hashedToken, resetToken) {
    // Postgres UPSERT version of ON DUPLICATE KEY UPDATE
    const query = `
      INSERT INTO password_resets (user_id, token, token_hash, created_at, expires_at, is_used)
      VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 minutes', FALSE)
      ON CONFLICT (user_id)
      DO UPDATE SET
        token = EXCLUDED.token,
        token_hash = EXCLUDED.token_hash,
        created_at = EXCLUDED.created_at,
        expires_at = EXCLUDED.expires_at,
        is_used = FALSE
    `;

    const result = await executeQuery(query, [id, resetToken, hashedToken]);
    return result;
  }

  static async passwordReset(id, token, newPassword) {
    const {rows} = await executeQuery(
      `SELECT pr.*, u.email 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.user_id = $1 
       AND pr.is_used = FALSE
       AND pr.expires_at > NOW()`,
      [id]
    );

    const resetRecords = rows;
    if (!resetRecords || resetRecords.length === 0 || resetRecords[0].token !== token) {
      throw new Error('Invalid or expired token');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(resetRecords[0].token_hash, 'hex'),
        Buffer.from(hashedToken, 'hex')
      )
    ) {
      throw new ApiError(400, 'Invalid reset token');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newHashedPassword = await User.hashPassword(newPassword);

      await executeQuery(
        'UPDATE users SET password = $1 WHERE id = $2',
        [newHashedPassword, id]
      );

      await executeQuery(
        'UPDATE password_resets SET is_used = TRUE WHERE id = $1',
        [resetRecords[0].id]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { success: true, message: 'Password updated successfully' };
  }

  static async logOutUser(id) {
    await executeQuery(
      `UPDATE users 
       SET refresh_token = NULL, 
           refresh_token_expires_at = NULL, 
           token_signature = NULL 
       WHERE id = $1`,
      [id]
    );
  }

  static async storeRefreshToken(userId, refreshTokenHash) {
    const result = await executeQuery(
      `UPDATE users 
       SET refresh_token = $1, 
           refresh_token_expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $2`,
      [refreshTokenHash, userId]
    );
    return result;
  }

  static async findUserByGoogleId(googleID) {
    const {rows} = await executeQuery(
      `SELECT * FROM users WHERE google_id = $1 LIMIT 1`,
      [googleID]
    );
    return rows?.[0];
  }

  static async saveUserGoogle(sub, email, first_name, last_name, picture, email_verified) {
    const username = email.split('@')[0];
    await executeQuery(
      `INSERT INTO users 
       (google_id, username, email, first_name, last_name, image_url, verified, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sub, username, email, first_name, last_name, picture, email_verified, '[google-auth]']
    );

    const user = await User.findUserByGoogleId(sub);
    return user;
  }

  static async deleteUserInDB(id) {
    await executeQuery('DELETE FROM users WHERE id = $1', [id]);
  }

  static async dynamicQueryUpdate(updateParams, setClause) {
    const result = await executeQuery(
      `UPDATE users SET ${setClause} WHERE id = $${updateParams.length}`,
      updateParams
    );
    return result;
  }
}

module.exports = User;
// ...existing code...
