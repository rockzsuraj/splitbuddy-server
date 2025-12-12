const jwt = require('jsonwebtoken');
const { ApiError, UnauthorizedError, errorHandler, InternalServerError, } = require('../utils/apiError');
const { JWT_SECRET } = require('../config/env');
const logger = require('../utils/logger');
const User = require('../models/user.model');
const { refreshToken } = require('../controllers/auth.controller');
const { redisClient } = require('../config/redisClient');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req?.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }
    // 1️⃣ Optional: Redis blacklist check (only if Redis is ready)
    if (redisClient && redisClient.isReady) {
      try {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return next(new UnauthorizedError('Token has been revoked'));
        }
      } catch (err) {
        // Don’t break auth if Redis fails; just log and continue
        console.log('Redis blacklist check failed:', err.message);
      }
    } else {
      console.log('Redis not ready, skipping blacklist check');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Token expired', 'TOKEN_EXPIRED'));
      }
      if (err.name === 'JsonWebTokenError') {
        return next(new UnauthorizedError('Invalid token', 'INVALID_TOKEN'));
      }
      return next(new InternalServerError('Failed to authenticate token'));
    }

    const existUser = await User.findById(decoded.userId);
    if (!existUser) {
      return next(new UnauthorizedError('User no longer exists'));
    }

    if (existUser.password_changed_at) {
      const passwordChangedAtTimestamp = parseInt(existUser.password_changed_at.getTime() / 1000, 10);
      if (decoded.iat < passwordChangedAtTimestamp) {
        return next(new UnauthorizedError('Token no longer valid after password change. Please login again.'));
      }
    }

    req.user = existUser;
    logger.info(`Authenticated user ${decoded.userId}`);
    next();
  } catch (err) {
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