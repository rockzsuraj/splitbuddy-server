const { ValidationError } = require('../utils/apiError');
const validator = require('validator');
const { body, query, param, validationResult } = require('express-validator');

/**
 * Validate request and throw ValidationError if invalid
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    throw new ValidationError(errorMessages);
  }
  next();
};

// Common validation chains
const emailValidator = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail();

const passwordValidator = body('password')
  .trim()
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain at least one number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character');

const refreshTokenValidator = param('refreshToken')
  .notEmpty().withMessage('Refresh token is required');

const mobileValidator = body('mobile')
  .optional({ checkFalsy: true })
  .trim()
  .isMobilePhone().withMessage('Invalid mobile number');

const objectIdValidator = param('id')
  .trim()
  .notEmpty().withMessage('ID is required')
  .isMongoId().withMessage('Invalid ID format');

// Custom validators
const isValidDate = (value) => {
  if (!value) return true;
  if (!validator.isISO8601(value)) {
    throw new Error('Invalid date format. Use ISO8601 format (YYYY-MM-DD)');
  }
  return true;
};

const isEnum = (enumObject) => (value) => {
  if (!value) return true;
  if (!Object.values(enumObject).includes(value)) {
    throw new Error(`Invalid value. Must be one of: ${Object.values(enumObject).join(', ')}`);
  }
  return true;
};

const roleEnum = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

const roleValidator = body('role')
  .optional()
  .custom(isEnum(roleEnum))
  .withMessage(`Role must be one of: ${Object.values(roleEnum).join(', ')}`);

// Validation schemas
const authValidation = {
  register: [
    emailValidator,
    passwordValidator,
    roleValidator,
    body('first_name')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
    body('last_name')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
    body('username')
      .trim()
      .notEmpty().withMessage('username is required')
      .isLength({ min: 2, max: 50 }).withMessage('username must be between 2-50 characters'),
    body('image_url')
      .optional
      .apply((value, { req }) => {
        if (value && !validator.isURL(value)) {
          throw new Error('Invalid image URL format');
        }
        return value;
      }),
    validateRequest
  ],

  login: [
    emailValidator,
    body('password').trim().notEmpty().withMessage('Password is required'),
    validateRequest
  ]
};

const userValidation = {
  getById: [
    objectIdValidator,
    validateRequest
  ],

  updateProfile: [
    objectIdValidator,
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
    emailValidator.optional(),
    mobileValidator,
    validateRequest
  ]
};

const paginationValidation = {
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
      .toInt(),
    query('sort')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Sort must be either asc or desc'),
    validateRequest
  ]
};

const refreshTokenValidation = [
  refreshTokenValidator,
  validateRequest
];

const forgotPasswordValidation = [
  emailValidator,
  validateRequest
];

const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .custom(value => validator.isHexadecimal(value)).withMessage('Invalid token format'),

  body('id')
    .notEmpty().withMessage('User ID is required')
    .isInt().withMessage('Invalid user ID'),

  body('newPassword')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
  validateRequest
];

const changePasswordValidation = [
  body('password').notEmpty().withMessage('password is required'),
  body('newPassword')
    .notEmpty().withMessage('new password is required')
    .isLength({ min: 8 }).withMessage('new password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('new password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('new password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('new password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('new password must contain at least one special character'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
  validateRequest
];

// Custom validation middleware
const validate = (schema) => {
  if (!schema) {
    throw new Error('Validation schema is required');
  }
  return [...schema, validateRequest];
};

const updateProfileValidation = [
  // Optional fields (PATCH allows partial updates)
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name contains invalid characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name contains invalid characters'),
  body('username')
    .trim()
    .notEmpty().withMessage('username is required')
    .isLength({ min: 2, max: 50 }).withMessage('username must be between 2-50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('image_url')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
    .matches(/\.(jpeg|jpg|gif|png|webp)$/i)
    .withMessage('Invalid image format'),

  // Prevent malicious field updates
  body().custom((value, { req }) => {
    const allowedFields = [
      'first_name',
      'last_name',
      'username',
      'email',
      'image_url'
    ];
    const invalidFields = Object.keys(req.body).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
    }
    return true;
  }),
  validateRequest
];

// group

const createGroup = [
  body('group_name')
    .notEmpty()
    .trim()
    .isLength({ max: 20, min: 2 })
    .withMessage('Group must be between 2-20 characters')
  ,
  body('description')
    .notEmpty()
    .trim()
    .isLength({ max: 50, min: 5 })
    .withMessage("Group description must be between 5-50 characters"),
  validateRequest
]

const updateAvatar = [
  // Custom validator using req.file from multer
  body().custom((_, { req }) => {
    if (!req.file) {
      throw new Error('Avatar file is required');
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) {
      throw new Error('Invalid image format (jpeg/jpg/png/webp only)');
    }

    // 2 MB limit (multer already limits, but double-check)
    const maxSize = 2 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new Error('Image size must be less than 2 MB');
    }

    return true;
  }),
  validateRequest,
];

module.exports = {
  validate,
  validateRequest,
  authValidation,
  userValidation,
  paginationValidation,
  customValidators: {
    isValidDate,
    isEnum
  },
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
  createGroup,
  updateAvatar
};