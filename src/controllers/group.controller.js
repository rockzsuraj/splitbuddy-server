const ApiResponse = require("../utils/apiResponse");
const groupService = require('../services/group.service');

const createGroup = async (req, res, next) => {
    try {
        const created_by = req.user.id;
        const { group_name, description } = req.body;
        const response = await groupService.createGroup(group_name, description, created_by)
        ApiResponse.createdResponse(res, 'successfully created group', { group: response })
    } catch (error) {
        next(error)
    }
}

const updateGroup = async (req, res, next) => {
    try {
        const { group_name, description } = req.body;
        const groupID = req.params.groupID;
        await groupService.updateGroup(group_name, description, groupID);
        ApiResponse.successResponse(res, 'Group is successfully updated!');
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
        const userID = req.body.user_id;
        const group_id = req.params.groupID;
        await groupService.addMember(group_id, userID);
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
    fetchGroupsForUserMember
}