const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/apiError');
const { JWT_SECRET } = require('../config/env');
const logger = require('../utils/logger');
const User = require('../models/user.model');
const { sanitizeUser } = require('../utils/helper');
const { refreshToken } = require('../controllers/auth.controller');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header/cookies
    const token = req?.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. Attach user to request

    const existUser = await User.findById(decoded.userId);

    if (!existUser) {
      throw next(new ApiError(401, 'User no longer exist'))
    }
    const sanitizedUser = sanitizeUser(existUser);

    req.user = sanitizedUser;

    logger.info(`Authenticated user ${decoded.userId}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired', 'TOKEN_EXPIRED'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token', 'INVALID_TOKEN'));
    }
    next(err);
  }
};

/**
 * Role-based authorization middleware
 */
// Middleware to authorize based on roles
const authorize = (roles = []) => {
  // If roles is a string, convert it to an array (for convenience)
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {

      console.log('decoded', req);
  
    // Check if user exists and has a role
    if (!req.user?.role) {
      return next(new ApiError(401, 'Unauthorized - No user role found'));
    }

    // Check if user's role is included in allowed roles
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden - Insufficient permissions'));
    }

    next();
  };
};

// Middleware to handle token refresh
const handleTokenRefresh = async (err, req, res, next) => {
  if (err.name === 'TokenExpiredError') {
    return refreshToken(req, res, next);
  }
  next(err);
};

module.exports = {
  authenticate,
  authorize,
  handleTokenRefresh
};