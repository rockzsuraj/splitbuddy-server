// Define all error classes first
class ApiError extends Error {
  constructor(statusCode, message, code, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.name = this.constructor.name;

    if (code) {
      this.code = code
    }

    // Always log to console when error is created
    console.error(`[${this.timestamp}] ${this.name}: ${message}`);
    if (stack) console.error(stack);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

class DatabaseError extends ApiError {
  constructor(message = 'Database Error', error) {
    super(500, message);
    if (error) {
      this.details = {
        code: error.code,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        sql: error.sql
      };
    }
  }
}

class ValidationError extends ApiError {
  constructor(errors = [], message = 'Validation Failed') {
    super(422, message);
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too Many Requests') {
    super(429, message);
  }
}

// Handler functions
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Not Found - ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  // Color coding for terminal
  const statusColor = err.statusCode >= 500 ? '\x1b[31m' : '\x1b[33m';
  const resetColor = '\x1b[0m';

  // Terminal logging
  console.error(`\n${statusColor}--- ERROR HANDLED ---${resetColor}`);
  console.error(`Timestamp: ${err.timestamp || new Date().toISOString()}`);
  console.error(`Status: ${statusColor}${err.statusCode || 500}${resetColor}`);
  console.error(`Type: ${err.name}`);
  console.error(`Message: ${err.message}`);
  console.error(`Path: ${req.path}`);
  console.error(`Method: ${req.method}`);
  if (err.stack) console.error(`Stack:\n${err.stack}`);
  if (err.details) console.error('Details:', err.details);
  if (err.errors) console.error('Validation Errors:', err.errors);
  console.error(`${statusColor}-------------------${resetColor}\n`);

  // Application logger
  if (req.logger) {
    req.logger.error(err.message, {
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      details: err.details,
      errors: err.errors
    });
  }

  // Convert error to ApiError if needed
  if (!(err instanceof ApiError)) {
    if (err.name === 'JsonWebTokenError') {
      err = new UnauthorizedError('Invalid token');
    } else if (err.name === 'TokenExpiredError') {
      err = new UnauthorizedError('Token expired');
    } else if (err.name === 'SequelizeValidationError') {
      err = new ValidationError(err.errors.map(e => e.message));
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      err = new ConflictError('Duplicate entry');
    } else if (err.name === 'SequelizeDatabaseError') {
      err = new DatabaseError('Database operation failed', err);
    } else {
      err = new InternalServerError(err.message);
    }
  }

  // Error response
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.statusCode,
      name: err.name,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      }),
      ...(err.errors && { errors: err.errors }),
      timestamp: err.timestamp
    }
  });
};

// Export everything
module.exports = {
  // Base Error Classes
  ApiError,

  // HTTP Error Classes
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,

  // Specialized Error Classes
  DatabaseError,
  ValidationError,
  RateLimitError,

  // Middleware Handlers
  notFoundHandler,
  errorHandler,

  // Utility Exports
  handleError: errorHandler, // Alias for errorHandler
  throwError: (status, message) => { // Helper function
    throw new ApiError(status, message);
  }
};