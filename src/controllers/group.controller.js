const ApiResponse = require("../utils/apiResponse");
const groupService = require('../services/group.service');
const ExpenseService = require("../services/expense.service");

const createGroup = async (req, res, next) => {
    try {
        const created_by = req.user.id;
        const { group_name, description, group_icon } = req.body;

        const response = await groupService.createGroup(
            group_name,
            description,
            created_by,
            group_icon
        );

        ApiResponse.createdResponse(res, 'successfully created group', { group: response });
    } catch (error) {
        next(error);
    }
};

const updateGroup = async (req, res, next) => {
    try {
        const { group_name, description, split_mode } = req.body;
        const groupID = req.params.groupID;
        const group = await groupService.updateGroup(groupID, { group_name, description, split_mode });
        ApiResponse.successResponse(res, 'Group is successfully updated!', { group });
    } catch (error) {
        next(error)
    }
}

const deleteGroup = async (req, res, next) => {
    try {
        const group_id = req.params.groupID;
        await groupService.deleteGroup(group_id);
        ApiResponse.successResponse(res, 'Group is successfully deleted!');
    } catch (error) {
        next(error)
    }
}

const addMember = async (req, res, next) => {
    try {
        const email = req.body.email;
        const group_id = req.params.groupID;
        await groupService.addMember(group_id, email);
        ApiResponse.successResponse(res, 'Member added successfully');
    } catch (error) {
        next(error)
    }
}

const removeMember = async (req, res, next) => {
    try {
        const userID = req.params.userID;
        const group_id = req.params.groupID;
        await groupService.removeMember(group_id, userID);
        ApiResponse.successResponse(res, 'Member successfully removed!');
    } catch (error) {
        console.log('error', error);

        next(error)
    }
}

const findGroupById = async (req, res, next) => {
    try {
        const group_id = req.params.groupID;
        const row = await groupService.findGroupById(group_id);
        ApiResponse.successResponse(res, "Successfully find group!", {
            group: row
        })
    } catch (error) {
        next(error)
    }
}

const getGroupDetails = async (req, res, next) => {
    try {
        const group_id = req.params.groupID;
        const mode = req.query.mode === 'splitwise' ? 'splitwise' : 'tricount';
        const row = await ExpenseService.getGroupDetails(group_id, mode);
        console.log('row controller', row);
        ApiResponse.successResponse(res, "Successfully find group!", {group: row})
    } catch (error) {
        next(error)
    }
}

const fetchGroupsForUserMember = async (req, res, next) => {
    try {
        const userID = req.params.userID;
        const row = await groupService.fetchGroupsForUserMember(userID);
        ApiResponse.successResponse(res, 'Success', {
            group: row
        })
    } catch (error) {
        next(error);
    }
}


module.exports = {
    createGroup,
    deleteGroup,
    updateGroup,
    addMember,
    removeMember,
    findGroupById,
    fetchGroupsForUserMember,
    getGroupDetails
}