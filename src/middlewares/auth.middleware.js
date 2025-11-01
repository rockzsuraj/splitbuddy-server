const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/apiError');
const { JWT_SECRET } = require('../config/env');
const logger = require('../utils/logger');
const User = require('../models/user.model');
const { sanitizeUser } = require('../utils/helper');
const { refreshToken } = require('../controllers/auth.controller');

const authenticate = async (req, res, next) => {
  try {
    // 1. Get token with null coalescing operator for cleaner code
    const token = req?.cookies?.accessToken ?? req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new ApiError(401, 'Authentication required'));
    }

    // 2. Add try-catch specifically for token verification
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired', 'TOKEN_EXPIRED'));
      }
      return next(new ApiError(401, 'Invalid token', 'INVALID_TOKEN'));
    }

    // 3. Add timeout for database query
    const existUser = await Promise.race([
      User.findById(decoded.userId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);

    if (!existUser) {
      return next(new ApiError(401, 'User no longer exists'));
    }

    req.user = sanitizeUser(existUser);
    
    // 4. Move logger after successful authentication
    logger.info(`User authenticated: ${decoded.userId}`);
    return next();
    
  } catch (err) {
    if (err.message === 'Database timeout') {
      return next(new ApiError(503, 'Service temporarily unavailable'));
    }
    return next(err);
  }
};

// Improved authorize middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    // Convert to array if string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!req?.user?.role) {
      return next(new ApiError(401, 'Unauthorized - No user role found'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden - Insufficient permissions'));
    }

    return next();
  };
};

// Improved token refresh handler
const handleTokenRefresh = async (req, res, next) => {
  try {
    const result = await refreshToken(req, res, next);
    return result;
  } catch (err) {
    return next(new ApiError(401, 'Token refresh failed'));
  }
};

module.exports = {
  authenticate,
  authorize, 
  handleTokenRefresh
};