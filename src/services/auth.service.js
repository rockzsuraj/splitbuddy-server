// In your login service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Use bcrypt for password hashing
const { JWT_SECRET, JWT_EXPIRES_IN, EMAIL_FROM, FRONTEND_URL } = require('../config/env');
const { findByEmail, create, findByUsername, saveResetToken, passwordReset, logOutUser, updateWithHashedToken, storeRefreshToken, findUserByGoogleId, saveUserGoogle, passwordChange } = require('../models/user.model');
const { sanitizeUser, getTokenTtlSeconds } = require('../utils/helper');
const { sendPasswordResetEmail } = require('../services/email.service');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');
const path = require('path');
const pug = require('pug');
const { validateRefreshToken } = require('./user.service');
const { updateMyAvatar: updateMyProfileImage } = require('../middlewares/uploadAvatar');
const { initPool } = require('../config/database');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const redisClient = require('../config/redisClient');

async function generateTokens(user) {
  // 1. Generate token (80-character hex)
  const refreshToken = crypto.randomBytes(32).toString('hex');

  // 2. Create fast-searchable signature
  const tokenSignature = crypto.createHash('sha256')
    .update(refreshToken)
    .digest('hex'); // 64-character hex

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  const access_token = jwt.sign(
    { userId: user.id, userEmail: user.email, role: user.role, auth_method: user.google_id ? 'google' : 'email' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return { access_token, refresh_token: refreshToken, refreshTokenHash, tokenSignature };
}

async function comparePassword(password, user) {
  try {
    const isValid = await bcrypt.compare(password, user.password);
    return isValid;
  } catch (error) {
    throw new ApiError.ValidationError(error, 'Invalid password!')
  }
}

async function validateCredentials(email, username, password) {
  console.log('Validating credentials for:', email || username);

  if ((!email && !username) || !password) {
    throw new ApiError.BadRequest('Email/Username and password are required');
  }

  // Find user
  let user = null;
  if (email) {
    user = await findByEmail(email);
  } else {
    user = await findByUsername(username);
  }
  console.log('user', user);
  if (!user) {
    throw new ApiError.NotFoundError('User not found');
  }

  if (!user.password) {
    throw new ApiError.InternalServerError('User record missing password hash');
  }

  const isMatch = await comparePassword(password, user)
  if (!isMatch) {
    throw new ApiError.UnauthorizedError('Invalid email/username or password');
  }
  return user;
}

async function login(email, password, username) {
  const validUser = await validateCredentials(email, username, password);
  const sanitizedUser = sanitizeUser(validUser);

  const { access_token, refresh_token, tokenSignature, refreshTokenHash } = await generateTokens(validUser);
  if (!access_token || !refresh_token) {
    throw new ApiError.InternalServerError('Failed to generate tokens');
  }

  await updateWithHashedToken(sanitizedUser.id, refreshTokenHash, tokenSignature);

  return {
    user: sanitizedUser,
    token: access_token,
    refreshToken: refresh_token,
  };
}
async function logout(token, id) {
  const ttl = getTokenTtlSeconds(token); // keep blacklist entry until token would naturally expire

  if (ttl > 0) {
    await redisClient.set(`blacklist:${token}`, 'true', { EX: ttl });
  }
  await logOutUser(id);
}

async function register(username, first_name, last_name, email, password) {
  // Validate input and check for existing user
  const existingUser = await findByEmail(email);
  console.log('existingUser', existingUser);

  if (existingUser) {
    throw new ApiError.ConflictError('User already exists');
  }
  const encryptedPassword = await bcrypt.hash(password, 10);
  const user = {
    username,
    first_name,
    last_name,
    email,
    password: encryptedPassword,
    image_url: ''
  }


  // Create new user
  const newUser = await create(user);
  const { access_token, refresh_token } = await generateTokens(newUser);
  return { user: newUser, token: access_token, refreshToken: refresh_token };
}

async function generatePasswordResetToken(user) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  return { resetToken, hashedToken };
}

async function forgotPassword(email) {
  console.log('email auth', email);

  const user = await findByEmail(email);

  if (!user) {
    throw new ApiError.NotFoundError('User not found');
  }
  // if (user.passwordResetToken) {
  //   throw new ApiError(400, 'Password reset already requested');
  // }

  const { hashedToken, resetToken } = await generatePasswordResetToken(user);
  // Store the hashed token in the database (you might want to create a new field in your user model)
  // For simplicity, let's assume you have a field called `passwordResetToken` in your user model

  await saveResetToken(user.id, hashedToken, resetToken);

  const resetUrl = `${FRONTEND_URL}/api/v1/auth/reset-password?token=${resetToken}&id=${user.id}`;

  // 5. Compile and send email using your template
  const emailTemplatePath = path.join(__dirname, '../templates/sendemail.template.pug');
  const html = pug.renderFile(emailTemplatePath, {
    username: user.username,
    resetLink: resetUrl,
    expiryTime: '30 minutes',
    supportEmail: EMAIL_FROM
  });



  const mailOptions = {
    from: `Suraj kumar ${EMAIL_FROM}`,
    to: user.email,
    subject: 'Password Reset Request',
    html: html,
  };
  await sendPasswordResetEmail(mailOptions);

  return { success: true, message: 'Password reset email sent' };

}

async function resetPassword(id, token, newPassword, confirmPassword) {

  if (newPassword !== confirmPassword) {
    throw new ApiError.UnauthorizedError('Password doesn\'t match!')
  }

  const result = await passwordReset(id, token, newPassword);
  return result;
}

async function refreshToken(refreshToken) {
  if (!refreshToken) {
    throw new ApiError.BadRequestError('Refresh token missing');
  }

  const user = await validateRefreshToken(refreshToken);
  const { access_token, refreshTokenHash, refresh_token, tokenSignature } = await generateTokens(user);
  await storeRefreshToken(user.id, refreshTokenHash, tokenSignature);
  return { user, access_token, refresh_token };

}

// Process user authentication
async function processUserAuth(sub, email, given_name, family_name, picture, email_verified) {
  // Find or create user in your DB
  let user = await findUserByGoogleId(sub);

  console.log('google user found ', user);


  if (!user) {
    user = await saveUserGoogle(sub, email, given_name, family_name, picture, email_verified);
  }

  return user;
}

async function changePassword(password, newPassword, confirmPassword, user) {

  if (newPassword !== confirmPassword) {
    throw new ApiError.ValidationError('confirm password and password does not not match!');
  }

  const isMatch = await comparePassword(password, user)
  if (!isMatch) {
    throw new ApiError.UnauthorizedError('Invalid password');
  }

  const result = await passwordChange(user.id, newPassword)
  console.log('result service', result);

  return result;
}

const updateMyAvatar = async (req, res) => {
  try {
    // ✅ validate here instead of express-validator
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar file is required' });
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({ message: 'Invalid image format (jpeg/jpg/png/webp only)' });
    }

    const maxSize = 2 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res
        .status(400)
        .json({ message: 'Image size must be less than 2 MB' });
    }

    const userId = req.user.id; // or whatever you use

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'user_avatars',
        public_id: `user_${userId}`,
        overwrite: true,
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res
            .status(500)
            .json({ message: 'Error uploading image to Cloudinary' });
        }

        const imageUrl = result.secure_url;

        try {
          const { rows } = await initPool().query(
            `UPDATE users
             SET image_url = $1
             WHERE id = $2
             RETURNING *`,
            [imageUrl, userId]
          );

          if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
          }

          return res.status(200).json({
            status: 'success',
            data: { user: rows[0] },
          });
        } catch (dbErr) {
          console.error('DB error:', dbErr);
          return res
            .status(500)
            .json({ message: 'Error saving image URL in database' });
        }
      }
    );

    // Buffer → Cloudinary stream
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: 'Unexpected error while updating avatar' });
  }
};

module.exports = {
  login,
  register,
  generatePasswordResetToken,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  processUserAuth,
  generateTokens,
  changePassword,
  updateMyAvatar
};