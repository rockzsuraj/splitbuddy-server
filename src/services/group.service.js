const Group = require('../models/group.model');
const User = require('../models/user.model');
const apiError = require('../utils/apiError');

const createGroup = async (group_name, description, created_by) => {
    const row = await Group.createGroup(group_name, description, created_by);
    return row;
}

const deleteGroup = async (groupId) => {
    const row = await Group.deleteGroup(groupId);
    return row;
}

const updateGroup = async (group_name, description, groupID) => {
    const row = await Group.updateGroup(group_name, description, groupID);
    return row;
}

const addMember = async (groupId, userId) => {
    const userExist = await User.findById(userId)
    if (!userExist) {
        throw new apiError.NotFoundError('User not found');
    }
    const row = await Group.addMember(groupId, userId);
    return row
}

const findGroupById = async (groupId) => {
    const row = await Group.findById(groupId);
    return row;
}

const findMember = async (groupID, userId) => {
    const row = await Group.findMember(groupID, userId)
    return row
}

const removeMember = async (groupId, userId) => {
    const memberExist = await findMember(groupId, userId);
    console.log('memberExist', memberExist);

    if (!memberExist) {
        // throw new Error('Member not exist!');
        throw new apiError.NotFoundError('Member not exist!')
    }
    const row = await Group.removeMember(groupId, userId);
    return row;
}

const fetchGroupsForUserMember = async (userID) => {
    const row = await Group.fetchGroupsForUserMember(userID);
    return row;
}


module.exports = {
    createGroup,
    deleteGroup,
    updateGroup,
    addMember,
    findGroupById,
    removeMember,
    findMember,
    fetchGroupsForUserMember
}