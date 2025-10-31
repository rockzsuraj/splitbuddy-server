const { executeQuery } = require('../config/database');
const User = require('../models/user.model');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sanitizeUser } = require('../utils/helper');
const ApiError  = require('../utils/apiError');

class UserService {
  async validateRefreshToken(refreshToken) {
    // 1. Generate signature for fast lookup
    const tokenSignature = crypto.createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // 2. Indexed query (millisecond response even with 1M+ users)
    const [user] = await executeQuery('SELECT * FROM users WHERE token_signature = ? AND refresh_token_expires_at > NOW()'
      , [tokenSignature]
    )

    if (!user) {
      throw new Error('Refresh token is expired!')
    };

    console.log('check ==>', refreshToken, user.refresh_token);
    const sanitizedUser = sanitizeUser(user);
    

    // 3. Verify against bcrypt hash
    const isValid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (isValid) {
      return sanitizedUser
    }

    throw new Error('Refresh token is invalid!')
  }

  async registerUser(userData) {
    // Add validation if needed
    const userId = await User.create(userData);
    return User.findById(userId);
  }

  async getUserByEmail(email) {
    return User.findByEmail(email);
  }

  async getUserByUsername(email) {
    return User.findByEmail(email);
  }

  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError.NotFoundError('User not found');
    }
    return user;
  }

  async getAllUsers() {
    const users = await User.findAll();
    if (!users || users.length === 0) {
      throw new ApiError.NotFoundError('No users found');
    }
    return users;
  }

  async updateProfile(id, updates) {
    const updateField = {}

    if (updates.email) {
      updateField.email = updates.email
    }
    if (updates.first_name) {
      updateField.first_name = updates.first_name
    }
    if (updates.last_name) {
      updateField.last_name = updates.last_name
    }
    if (updates.image_url) {
      updateField.image_url = updates.image_url
    }

    const allowedFields = [
      'username', 'email', 'first_name',
      'last_name', 'image_url'
    ];

    const updateFields = {};
    const updateParams = [];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
        updateParams.push(updates[field]);
      }
    });

    if (Object.keys(updateFields).length === 0) {
      throw new ApiError.ConflictError('No valid fields to update');
    }

    // 5. Build dynamic SQL
    const setClause = Object.keys(updateFields)
      .map(field => `${field} = ?`)
      .join(', ');

    updateParams.push(id);

    console.log('setClause', setClause);
    console.log('id', id);



    // 6. Execute update
    await User.dynamicQueryUpdate(updateParams, setClause)

    // 7. Return updated user
    const user = await User.findById(id);
    return user;
  }

  // Add more business logic methods
}

module.exports = new UserService();