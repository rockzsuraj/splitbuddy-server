const express = require('express');
const { authorize, authenticate } = require('../middlewares/auth.middleware');
const groupController = require('../controllers/group.controller');
const { createGroup, updateGroup, addMember, deleteGroup, fetchGroupsForUserMember, findGroupById, removeMember } = require('../validations/group.validation');
const ExpenseController = require('../controllers/expense.controller');

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
        groupController.getGroupDetails
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

// POST /api/groups/:groupId/expenses
router.post('/:groupId/expenses', authenticate, ExpenseController.addExpense);
router.patch('/:groupId/expenses/:expenseId', authenticate, ExpenseController.updateExpense);
router.delete('/:groupId/expenses/:expenseId', authenticate, ExpenseController.deleteExpense);

// GET /api/groups/:groupId/balances
router.get('/:groupId/balances', authenticate, ExpenseController.getBalances);

// POST /api/groups/:groupId/settlements
router.post('/:groupId/settlements', authenticate, ExpenseController.createSettlement);

module.exports = router;