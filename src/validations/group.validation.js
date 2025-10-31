// validation/groupValidation.js
const { body, param } = require('express-validator');
const { validate } = require('./auth.validation');

module.exports = {
    createGroup: validate([
        body('group_name')
            .notEmpty().withMessage('group_name is required')
            .trim()
            .isLength({ min: 2, max: 20 }).withMessage('group_name must be 2-20 characters'),

        body('description')
            .notEmpty().withMessage('description is required')
            .trim()
            .isLength({ min: 5, max: 50 }).withMessage('description must be 5-50 characters')
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

        body().custom((value, { req }) => {
            if (!req.body.group_name && !req.body.description) {
                throw new Error('At least one of group_name or description is required');
            }
            return true;
        })
    ]),

    deleteGroup: validate([
        param('groupID')
            .isInt({ min: 1 }).withMessage('Invalid group ID format')
            .toInt()
    ]),

    addMember: validate([
        param('groupID')
            .notEmpty().withMessage('group_id is required')
            .isInt({ min: 1 }).withMessage('group_id must be a positive integer')
            .toInt(),

        body('user_id')
            .notEmpty().withMessage('user_id is required')
            .isInt({ min: 1 }).withMessage('user_id must be a positive integer')
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