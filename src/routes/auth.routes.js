const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); // Verify this path
const {
  validate,
  authValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateAvatar
} = require('../validations/auth.validation')

const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { ApiError } = require('../utils/apiError');
const { processUserAuth, generateTokens } = require('../services/auth.service');
const { ApiResponse } = require('../utils/apiResponse');
const { updateWithHashedToken } = require('../models/user.model');
const { sanitizeUser } = require('../utils/helper');
const uploadAvatar = require('../middlewares/uploadAvatar');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again later'
});

// Register
router.post('/register',
  validate(authValidation.register),
  authController.register // Ensure this matches exported method name
);

// Login
router.post('/login',
  authLimiter,
  validate(authValidation.login),
  authController.login // Ensure this matches exported method name
);

//logout

router.post('/logout',
  authenticate,
  authController.logout
)

// Refresh Token
router.post('/refresh-token/:refreshToken',
  validate(refreshTokenValidation),
  authController.refreshToken // Ensure this matches exported method name
);

// Forgot Password
router.post('/forgot-password',
  validate(forgotPasswordValidation),
  authController.forgotPassword // Ensure this matches exported method name
);

// Reset Password
router.route('/reset-password')
  .get(
    authController.showResetForm
  )
  .post(
    validate(resetPasswordValidation),
    authController.resetPassword // Ensure this matches exported method name
  );

// Reset Password
router.post('/change-password',
  authenticate,
  validate(changePasswordValidation),
  authController.changePassword // Ensure this matches exported method name
);

//delete user
router.route('/delete')
  .delete(
    authenticate,
    authorize(['user', 'admin']),
    authController.deleteUser
  )

// When initiating OAuth flow
router.get('/google', (req, res) => {
  const authUrl = authController.getGoogleAuthURL('unique-request-id');
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const { authRequestId, googleUser } = await authController.handleGoogleCallback(code, state);

  if (!googleUser) {
    new ApiError(401)('Google user not found!')
  }
  const { sub, given_name, family_name, picture, email, email_verified } = googleUser;

  console.log('google user', googleUser);

  // Handle successful authentication
  const userResponse = await processUserAuth(sub, email, given_name, family_name, picture, email_verified);

  console.log('userResponse', userResponse);


  const { access_token, refresh_token, tokenSignature, refreshTokenHash } = await generateTokens(userResponse);
  if (!access_token || !refresh_token) {
    throw new Error('Failed to generate token');
  }
  const sanitizedUser = sanitizeUser(userResponse);
  await updateWithHashedToken(sanitizedUser.id, refreshTokenHash, tokenSignature);
  new ApiResponse(res, { data: { user: sanitizedUser, access_token, refresh_token } }).send('Login successful', sanitizedUser);
});

router.patch(
  '/me/avatar',
  authenticate,
  uploadAvatar,
  authController.updateMyAvatar
);


module.exports = router;