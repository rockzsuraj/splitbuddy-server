const { getAllUsers } = require('../services/user.service');
const { ApiResponse } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/apiError');
const { executeQuery } = require('../config/database');
const { findById } = require('../models/user.model');
const userService = require('../services/user.service');
const { sanitizeUser } = require('../utils/helper');

exports.getProfile = async (req, res, next) => {
    try {
        new ApiResponse(res, { data: req.user }).send('User profile', req.user);
    } catch (err) {
        next(err);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const users = await getAllUsers();
        if (!users || users.length === 0) {
            throw new NotFoundError('No users found');
        }
        new ApiResponse(res, { data: users }).send('Users list', users);
    } catch (err) {
        next(err);
    }
}

exports.updateProfile = async (req, res, next) => {
    try {
        const id = req.user.id;
       
        const user = await userService.updateProfile(id, req.body);
        new ApiResponse(res, {
            data: user
        }).send('user profile updated successfully!')

    } catch (error) {
        next(error);
    }
}