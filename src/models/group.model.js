const { executeQuery, initPool } = require("../config/database");

class Group {
    // create
    static async createGroup(group_name, description, created_by, group_icon) {
        const { rows } = await executeQuery(
            `
            INSERT INTO user_groups (group_name, description, created_by, group_icon, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
            `,
            [group_name, description, created_by, group_icon]
        );

        return rows[0];
    }

    // fetch groups for a user as member
    static async fetchGroupsForUserMember(user_id) {
        const { rows } = await executeQuery(
            `
            SELECT
            ug.*
            FROM user_groups AS ug
            INNER JOIN user_group_members AS ugm
                ON ug.group_id = ugm.group_id
            WHERE ugm.user_id = $1
            `,
            [user_id]
        );

        console.log('rows', rows);

        return rows;
    }

    // findByID
    static async findById(id) {
        const { rows } = await executeQuery(
            `SELECT * FROM user_groups WHERE group_id = $1`,
            [id]
        );
        return rows?.[0];
    }

    // addMember
    static async addMember(groupId, user_id) {
        const { rows } = await executeQuery(
            `
            INSERT INTO user_group_members (group_id, user_id, joined_at)
            VALUES ($1, $2, NOW())
            RETURNING *
            `,
            [groupId, user_id]
        );

        return rows[0];
    }

    static async findMember(groupID, userID) {
        const { rows } = await executeQuery(
            `
            SELECT *
            FROM user_group_members AS ugm
            INNER JOIN user_groups AS ug
                ON ugm.group_id = ug.group_id
            WHERE ugm.user_id = $1 AND ug.group_id = $2
            `,
            [userID, groupID]
        );

        return rows?.[0];
    }

    static async removeMember(groupID, userID) {
        const result = await executeQuery(
            `
            DELETE FROM user_group_members
            WHERE group_id = $1 AND user_id = $2
            `,
            [groupID, userID]
        );
        return result;
    }

    // delete group
    static async deleteGroup(groupID) {
        const result = await executeQuery(
            `
            DELETE FROM user_groups WHERE group_id = $1
            `,
            [groupID]
        );

        return result;
    }

    // update group
    static async updateGroup(group_id, updates = {}) {
        const ALLOWED = new Set(['group_name', 'description', 'split_mode', 'group_icon']);

        // group_id must be valid
        if (group_id == null || Number.isNaN(Number(group_id))) {
            throw new Error('group_id is required and must be a number');
        }

        // filter allowed + non-undefined values
        const entries = Object.entries(updates).filter(
            ([key, value]) => ALLOWED.has(key) && value !== undefined
            // If you also want to ignore nulls: && value !== null
        );

        if (entries.length === 0) {
            throw new Error('No valid fields provided to update');
        }

        const setClauses = entries.map(([key], idx) => `"${key}" = $${idx + 1}`);
        const values = entries.map(([, value]) => value);

        const groupIdParamIndex = values.length + 1;

        const sql = `
    UPDATE user_groups
    SET ${setClauses.join(', ')}
    WHERE group_id = $${groupIdParamIndex}
    RETURNING *
  `;
        const { rows } = await executeQuery(sql, [...values, Number(group_id)]);
        return rows[0];
    }

}

module.exports = Group;