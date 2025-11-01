const { pool, executeQuery } = require("../config/database");

class Group {
    // create
    static async createGroup(group_name, description, created_by) {
        const result = await executeQuery(
            `
            Insert INTO user_groups (group_name, description, created_by, created_at) VALUES( ?, ?, ?, NOW())
            `,
            [group_name, description, created_by]
        )

        console.log('result =>', result);
        

        const row = await Group.findById(result.insertId);
        return row;
    }

    // fetch groups

    static async fetchGroupsForUserMember(user_id) {
        const [row] = await executeQuery(
            `
            SELECT ug.group_id, ug.group_name, ug.description, ug.created_at, ugm.user_id, ugm.joined_at
            FROM user_groups AS ug INNER JOIN user_group_members
            AS ugm
            ON ug.group_id = ugm.group_id
            WHERE ugm.user_id = ?
            `,
            [user_id]
        )
        return row;
    }

    // findByID
    static async findById(id) {
        const [row] = await executeQuery(
            `SELECT * FROM user_groups WHERE group_id = ?`,
            [id]
        )
        return row;
    }
    // addMember

    static async addMember(groupId, userId) {
        const [result] = await pool.query(
            `INSERT INTO user_group_members SET ? `,
            { group_id: groupId, user_id: userId }
        )

        return result;
    }

    static async findMember(groupID, userID) {
        const [result] = await executeQuery(
            `
            SELECT * FROM user_group_members as ugm
            Inner JOIN user_groups AS ug
            ON ugm.group_id = ug.group_id
            WHERE ugm.user_id = ? AND ug.group_id = ?
            `,
            [userID, groupID]
        )
        console.log('result ==>', result);
        
        return result;
    }

    static async removeMember(groupID, userID) {
        const result = await executeQuery(`
            DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?
            `,
            [groupID, userID]
        )
        return result
    }

    // delete group

    static async deleteGroup(groupID) {
        const result = await executeQuery(
            `
            DELETE FROM user_groups WHERE group_id = ?
            `,
            [groupID]
        )

        return result;
    }

    // delete

    static async updateGroup(group_name, description, group_id) {
        const result = await executeQuery(
            `
            UPDATE user_groups SET group_name = ?, description = ? WHERE group_id = ?
            `,
            [group_name, description, group_id]
        )

        return result;
    }
}

module.exports = Group;