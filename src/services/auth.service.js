// In your login service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Use bcrypt for password hashing
const { JWT_SECRET, JWT_EXPIRES_IN, EMAIL_FROM, FRONTEND_URL } = require('../config/env');
const { findByEmail, create, findByUsername, saveResetToken, passwordReset, logOutUser, updateWithHashedToken, storeRefreshToken, findUserByGoogleId, saveUserGoogle } = require('../models/user.model');
const { sanitizeUser } = require('../utils/helper');
const { sendPasswordResetEmail } = require('../services/email.service');
const ApiError  = require('../utils/apiError');
const crypto = require('crypto');
const path = require('path');
const pug = require('pug');
const { validateRefreshToken } = require('./user.service');

async function generateTokens(user) {
  // 1. Generate token (80-character hex)
  const refreshToken = crypto.randomBytes(32).toString('hex');

  // 2. Create fast-searchable signature
  const tokenSignature = crypto.createHash('sha256')
    .update(refreshToken)
    .digest('hex'); // 64-character hex

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  const access_token = jwt.sign(
    { userId: user.id, userEmail: user.email, role: user.role, auth_method: user.google_id  ? 'google' : 'email'},
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return { access_token, refresh_token: refreshToken, refreshTokenHash, tokenSignature };
}

async function validateCredentials(email, username, password) {
  console.log('Validating credentials for:', email);
  if ((!email && !username) || !password) {
    throw new Error('Email OR Username and password are required');
  }
  if (email && username) {
    throw new Error('Please provide either email or username, not both');
  }

  // Find user by email or username
  let user;
  if (email) {
    user = await findByEmail(email);
  } else if (username) {
    user = await findByUsername(username);
  }
  if (!user) {
    throw new ApiError.NotFoundError('User not found');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  return user;
}

async function login(email, password, username) {
  const validUser = await validateCredentials(email, username, password);
  const sanitizedUser = sanitizeUser(validUser);

  const { access_token, refresh_token, tokenSignature, refreshTokenHash } = await generateTokens(validUser);
  if (!access_token || !refresh_token) {
    throw new ApiError.InternalServerError('Failed to generate token');
  }
  await updateWithHashedToken(sanitizedUser.id, refreshTokenHash, tokenSignature);

  return { user: sanitizedUser, token: access_token, refreshToken: refresh_token };
}

async function logout(id) {
  await logOutUser(id);
}

async function register(username, first_name, last_name, email, password) {
  // Validate input and check for existing user
  const existingUser = await findByEmail(email);
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
  return { user: newUser, token: access_token };
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
  const { access_token, refreshTokenHash, refresh_token } = await generateTokens(user);
  await storeRefreshToken(user.id, refreshTokenHash);
  return { user, access_token, refresh_token };

}

// Process user authentication
async function processUserAuth(sub, email, given_name, family_name, picture, email_verified) {
  // Find or create user in your DB
  let user = await findUserByGoogleId(sub);

  console.log('google user found ',user);
  

  if(!user) {
    user = await saveUserGoogle(sub, email, given_name, family_name, picture, email_verified);
  }

  return user;
}

module.exports = {
  login,
  register,
  generatePasswordResetToken,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  processUserAuth,
  generateTokens
};