const { ApiResponse } = require('../utils/apiResponse');
const authService = require('../services/auth.service');
const { generateStateToken } = require('../utils/helper');
const axios = require('axios');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = require('../config/env');
const { deleteUserInDB } = require('../models/user.model');
const ApiError = require('../utils/apiError');

const register = async (req, res, next) => {
  try {
    const { username, first_name, last_name, email, password } = req.body;
    const result = await authService.register(username, first_name, last_name, email, password);
    new ApiResponse(res, { data: result }).created('User registered successfully', result.user);
  } catch (err) {
    next(err);
  }
};

// src/controllers/auth.controller.js
const login = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if (!password || (!email && !username)) {
      throw new ApiError.BadRequestError(
        'Email or username and password are required'
      );
    }

    const authResult = await authService.login(email, password, username);
    new ApiResponse(res, { data: authResult }).send('Login successful');
  } catch (err) {
    // If you want to still support timeout, handle it gracefully:
    if (err.message === 'Operation timed out') {
      return next(new ApiError.RequestTimeout('Login operation took too long'));
    }
    next(err);
  }
};

const logout = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }
  try {
    await authService.logout(token, req.user.id)
    new ApiResponse(res).send('logout successful');
  } catch (error) {
    next(error);
  }
}


const refreshToken = async (req, res, next) => {
  try {
    console.log('req.params.refreshToken', req.params.refreshToken);

    const { access_token, refresh_token, user } = await authService.refreshToken(req.params.refreshToken);
    new ApiResponse(res, {
      data: {
        user,
        refreshToken: refresh_token,
        accessToken: access_token
      }
    }).send('Token refreshed successfully', user);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    new ApiResponse(res).send('Password reset email sent');
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, id, newPassword, confirmPassword } = req.body;
    await authService.resetPassword(id, token, newPassword, confirmPassword);
    res.render('reset-success.pug');
  } catch (err) {
    next(err);
  }
};

const showResetForm = async (req, res, next) => {
  try {
    const { token, id } = req.query;

    // Basic validation
    if (!token || !id) {
      return res.status(400).render('error', {
        message: 'Invalid reset link'
      });
    }

    res.render('reset-password', {
      token,
      id,
      error: null
    });
  } catch (error) {
    next(error);
  }
}

async function validateGoogleToken(idToken) {
  const { data } = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );

  if (data.aud !== GOOGLE_CLIENT_ID) {
    throw new ApiError.InternalServerError('Invalid token audience');
  }
  return data;
}

// Initiate Google OAuth flow
function getGoogleAuthURL(authRequestId) {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
    state: JSON.stringify({
      token: generateStateToken(),
      authRequestId // Unique ID for mobile client
    })
  };

  return `${rootUrl}?${new URLSearchParams(options)}`;
}

// Handle Google callback
async function handleGoogleCallback(code, state) {
  let stateData;
  try {
    stateData = JSON.parse(state);
  } catch (e) {
    throw new ApiError.InternalServerError('Invalid state format');
  }

  // Exchange code for tokens
  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_CALLBACK_URL,
    grant_type: 'authorization_code'
  });

  if (tokenResponse.status !== 200 && tokenResponse.statusText !== 'OK') {
    throw new ApiError.InternalServerError('Google token exchange failed!')
  }
  await validateGoogleToken(tokenResponse.data.id_token);

  // Get user info
  const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
  });
  return {
    googleUser: userInfo.data,
    authRequestId: stateData.authRequestId
  };
}

async function deleteUser(req, res, next) {
  const id = req.user.id;
  await deleteUserInDB(id)
  new ApiResponse(res).setMessage('User is successfully deleted!').send();
}

async function changePassword(req, res, next) {
  try {
    const user = req.user;
    const { password, newPassword, confirmPassword } = req.body;
    const { success, message } = await authService.changePassword(password, newPassword, confirmPassword, user);
    console.log('success message service', success, message);
    new ApiResponse(res).setMessage(message).send();
  } catch (error) {
    next(error);
  }
}

async function updateMyAvatar(req, res, next) {
  try {
    const result = await authService.updateMyAvatar(req, res);
    return result;
  } catch (error) {
    next(error);
  }
}

const exportsData = {
  handleGoogleCallback,
  getGoogleAuthURL,
  validateGoogleToken,
  showResetForm,
  resetPassword,
  forgotPassword,
  refreshToken,
  logout,
  login,
  register,
  deleteUser,
  changePassword,
  updateMyAvatar
}

module.exports = exportsData;