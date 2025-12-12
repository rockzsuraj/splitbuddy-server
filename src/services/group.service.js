const ExpenseModel = require('../models/expense.model');
const Group = require('../models/group.model');
const User = require('../models/user.model');
const apiError = require('../utils/apiError');

// Default icon to use when the client does not choose one
const DEFAULT_GROUP_ICON = 'others';

const createGroup = async (group_name, description, created_by, group_icon) => {
    // Fallback to a default icon if none is provided / is empty
    const finalIcon =
        typeof group_icon === 'string' && group_icon.trim().length > 0
            ? group_icon.trim()
            : DEFAULT_GROUP_ICON;

    const newGroup = await Group.createGroup(group_name, description, created_by, group_icon);
    await Group.addMember(newGroup.group_id, created_by);
    return newGroup
};

const deleteGroup = async (groupId) => {
    const row = await Group.deleteGroup(groupId);
    return row;
}

const updateGroup = async (groupID, { group_name, description, split_mode }) => {
    const row = await Group.updateGroup(groupID, { group_name, description, split_mode });
    return row;
}

const addMember = async (groupId, email) => {
    const userExist = await User.findByEmail(email)
    if (!userExist) {
        throw new apiError.NotFoundError('User not found');
    }
    const row = await Group.addMember(groupId, userExist.id);
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

const getGroupDetails = async (groupId) => {
    const row = await ExpenseModel.getGroupDetails(groupId);
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
    fetchGroupsForUserMember,
    getGroupDetails
}