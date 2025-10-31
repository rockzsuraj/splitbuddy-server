const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, updateProfileValidation } = require('../validations/auth.validation');

router.get('/profile',
    authenticate,
    authorize(['user', 'admin']),
    userController.getProfile
);

router.patch('/updateProfile',
    validate(updateProfileValidation),
    authenticate, authorize(['user', 'admin']),
    userController.updateProfile
);

router.get('/getAllUsers', authenticate, authorize(['user', 'admin']), userController.getUsers);

module.exports = router;