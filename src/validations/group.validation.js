// validation/groupValidation.js
const { body, param } = require('express-validator');
const { validate } = require('./auth.validation');

const emailValidator = body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail();


module.exports = {
    createGroup: validate([
        body('group_name')
            .notEmpty().withMessage('group_name is required')
            .trim()
            .isLength({ min: 2, max: 20 }).withMessage('group_name must be 2-20 characters'),

        body('description')
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 5, max: 50 }).withMessage('description must be 5-50 characters'),

        body('group_icon')
            .optional({ checkFalsy: true }) // <-- validates only if provided
            .isString().withMessage('group_icon must be a string')
    ]),
    updateGroup: validate([
        param('groupID')
            .isInt({ min: 1 }).withMessage('groupID must be a positive integer')
            .toInt(),

        body('group_name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 20 }).withMessage('group_name must be 2-20 characters'),

        body('description')
            .optional()
            .trim()
            .isLength({ min: 5, max: 50 }).withMessage('description must be 5-50 characters'),
        body('split_mode')
            .optional()
            .isIn(['splitwise', 'tricount']).withMessage('split_mode must be either splitwise or tricount')
    ]),

    deleteGroup: validate([
        param('groupID')
            .isInt({ min: 1 }).withMessage('Invalid group ID format')
            .toInt()
    ]),

    addMember: validate([
        emailValidator,
        param('groupID')
            .notEmpty().withMessage('group_id is required')
            .isInt({ min: 1 }).withMessage('group_id must be a positive integer')
            .toInt()
    ]),
    removeMember: validate([
        param('groupID')
            .isInt({ min: 1 }).withMessage('Invalid group ID format')
            .toInt(),
        param('userID')
            .isInt({ min: 1 }).withMessage('Invalid user ID format')
            .toInt()
    ]),

    findGroupById: validate([
        param('groupID')
            .isInt({ min: 1 }).withMessage('Invalid group ID format')
            .toInt()
    ]),

    fetchGroupsForUserMember: validate([
        param('userID')
            .isInt({ min: 1 }).withMessage('Invalid user ID format')
            .toInt()
    ])

    // Other validations remain similar with clear field names in messages
};