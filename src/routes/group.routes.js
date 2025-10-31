const express = require('express');
const { authorize, authenticate } = require('../middlewares/auth.middleware');
const groupController = require('../controllers/group.controller');
const { createGroup, updateGroup, addMember, deleteGroup, fetchGroupsForUserMember, findGroupById, removeMember } = require('../validations/group.validation');

const router = express.Router();

// Group CRUD operations
router.route('/')
    .post(
        createGroup,
        authenticate,
        authorize(['user', 'admin']),
        groupController.createGroup
    )

router.route('/:groupID')
    .get(
        findGroupById,
        authenticate,
        authorize(['user', 'admin']),
        groupController.findGroupById
    )
    .patch(
        updateGroup,
        authenticate,
        authorize(['user', 'admin']),
        groupController.updateGroup
    )
    .delete(
        deleteGroup,
        authenticate,
        authorize(['user', 'admin']),
        groupController.deleteGroup
    );

// User-specific group routes
router.get('/user/:userID',
    fetchGroupsForUserMember,
    authenticate,
    authorize(['user', 'admin']),
    groupController.fetchGroupsForUserMember
);

// Membership management
router.post('/:groupID/members',
    addMember,
    authenticate,
    authorize(['user', 'admin']),
    groupController.addMember
);

router.delete('/:groupID/members/:userID',
    removeMember,
    authenticate,
    authorize(['user', 'admin']),
    groupController.removeMember
);


module.exports = router;