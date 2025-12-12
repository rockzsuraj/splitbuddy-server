const { initPool, executeQuery } = require("../config/database");
const { calculateRecommendedSettlements } = require("../utils/helper");

class ExpenseModel {
  static async addExpense(groupId, paidBy, amount, description, expenseDate) {
    try {
      const insertExpenseQuery = `
        INSERT INTO user_expenses (group_id, paid_by, amount, description, expense_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const { rows: expenseRows } = await executeQuery(insertExpenseQuery, [
        groupId,
        paidBy,
        amount,
        description,
        expenseDate,
      ]);
      const expense = expenseRows[0];

      // Get all group members
      const membersQuery = `
        SELECT *
        FROM user_group_members
        WHERE group_id = $1
      `;
      const { rows: memberRows } = await executeQuery(membersQuery, [groupId]);

      if (memberRows.length === 0) {
        throw new Error("No members found in this group");
      }

      const perHead = Number(amount) / memberRows.length;

      const insertShareQuery = `
        INSERT INTO expense_shares (expense_id, user_id, share_amount)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      for (const m of memberRows) {
        await executeQuery(insertShareQuery, [expense.expense_id, m.user_id, perHead]);
      }

      return { expense, sharePerUser: perHead };
    } catch (err) {
      throw err;
    }
  }

 static async updateExpense(groupId, expenseId, updates = {}) {
  try {
    const allowed = {
      paidBy: "paid_by",
      amount: "amount",
      description: "description",
      expenseDate: "expense_date",
    };

    const setClauses = [];
    const values = [];
    let index = 1;

    // Build dynamic SET ... clauses
    for (const key of Object.keys(updates)) {
      const column = allowed[key];
      const value = updates[key];

      if (column && value !== undefined) {
        setClauses.push(`${column} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (setClauses.length === 0) {
      throw new Error("No valid fields to update");
    }

    // WHERE clause parameters
    values.push(expenseId, groupId);

    const sql = `
      UPDATE user_expenses
      SET ${setClauses.join(", ")}
      WHERE expense_id = $${index} AND group_id = $${index + 1}
      RETURNING *;
    `;

    const { rows } = await executeQuery(sql, values);
    return { expense: rows[0] };

  } catch (err) {
    throw err;
  }
}


  static async deleteExpense(groupId, expenseId) {
    try {
      const deleteExpenseQuery = `
        DELETE FROM user_expenses
        WHERE expense_id = $1 AND group_id = $2
      `;
      await executeQuery(deleteExpenseQuery, [expenseId, groupId]);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Fetch split_mode from database and calculate balances accordingly
   * - 'tricount'  -> use expense_shares
   * - 'splitwise' -> equal share of total group expense
   */
  static async getGroupBalances(groupId) {
    try {
      // Fetch split_mode from group
      const splitModeQuery = `
        SELECT * FROM user_groups WHERE group_id = $1
      `;
      const { rows: modeRows } = await executeQuery(splitModeQuery, [groupId]);

      if (modeRows.length === 0) {
        throw new Error("Group not found");
      }

      const splitMode = modeRows[0].split_mode || "splitwise";
      let query;

      if (splitMode === "splitwise") {
        // Splitwise-style: each member's fair share = total_group / member_count
        query = `
          WITH members AS (
            SELECT u.*
            FROM users u
            JOIN user_group_members gm
              ON gm.user_id = u.id
             AND gm.group_id = $1
          ),
          total_expense AS (
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM user_expenses
            WHERE group_id = $1
          ),
          member_count AS (
            SELECT COUNT(*) AS cnt
            FROM user_group_members
            WHERE group_id = $1
          ),
          paid AS (
            SELECT
              ue.paid_by AS user_id,
              SUM(ue.amount) AS total_paid
            FROM user_expenses ue
            WHERE ue.group_id = $1
            GROUP BY ue.paid_by
          )
          SELECT
            m.*,
            COALESCE(p.total_paid, 0)
              - CASE
                  WHEN mc.cnt > 0 THEN te.total / mc.cnt
                  ELSE 0
                END AS balance
          FROM members m
          LEFT JOIN paid p
            ON p.user_id = m.id
          CROSS JOIN total_expense te
          CROSS JOIN member_count mc
          ORDER BY balance DESC;
        `;
      } else {
        // Tricount-style: use expense_shares
        query = `
          SELECT
            u.*,
            COALESCE(paid.total_paid, 0) - COALESCE(share.total_share, 0) AS balance
          FROM users u
          JOIN user_group_members gm
            ON gm.user_id = u.id
           AND gm.group_id = $1

          LEFT JOIN (
            SELECT
              ue.paid_by AS user_id,
              SUM(ue.amount) AS total_paid
            FROM user_expenses ue
            WHERE ue.group_id = $1
            GROUP BY ue.paid_by
          ) AS paid
            ON paid.user_id = u.id

          LEFT JOIN (
            SELECT
              es.user_id,
              SUM(es.share_amount) AS total_share
            FROM expense_shares es
            JOIN user_expenses ue
              ON ue.expense_id = es.expense_id
             AND ue.group_id = $1
            GROUP BY es.user_id
          ) AS share
            ON share.user_id = u.id

          ORDER BY balance DESC;
        `;
      }

      const { rows } = await executeQuery(query, [groupId]);
      return rows;
    } catch (err) {
      throw err;
    }
  }

  static async getGroupDetails(groupId) {
    try {
      // Fetch split_mode from group
      const splitModeQuery = `
        SELECT * FROM user_groups WHERE group_id = $1
      `;
      const { rows: modeRows } = await executeQuery(splitModeQuery, [groupId]);

      if (modeRows.length === 0) return null;

      const splitMode = modeRows[0].split_mode || "splitwise";
      const isSplitwise = splitMode === "splitwise";

      const GROUP_DETAILS_QUERY = `
        WITH group_base AS (
          SELECT *
          FROM user_groups g
          WHERE g.group_id = $1
        ),

        members_agg AS (
          SELECT
            m.group_id,
            json_agg(
              json_build_object(
                'group_id', m.group_id,
                'user_id', m.user_id,
                'joined_at', m.joined_at,
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'image_url', u.image_url,
                'role', u.role,
                'verified', u.verified,
                'status', u.status
              )
              ORDER BY m.joined_at
            ) AS members
          FROM user_group_members m
          JOIN users u ON u.id = m.user_id
          WHERE m.group_id = $1
          GROUP BY m.group_id
        ),

        expenses_agg AS (
          SELECT
            e.group_id,
            json_agg(
              json_build_object(
                'expense_id', e.expense_id,
                'group_id', e.group_id,
                'paid_by', e.paid_by,
                'amount', e.amount,
                'description', e.description,
                'expense_date', e.expense_date,
                'created_at', e.created_at,
                'payer', json_build_object(
                  'id', payer.id,
                  'username', payer.username,
                  'first_name', payer.first_name,
                  'last_name', payer.last_name,
                  'email', payer.email,
                  'role', payer.role,
                  'verified', payer.verified
                )
              )
              ORDER BY e.expense_date DESC, e.created_at DESC
            ) AS expenses,
            COALESCE(SUM(e.amount), 0) AS total_expense
          FROM user_expenses e
          JOIN users payer ON payer.id = e.paid_by
          WHERE e.group_id = $1
          GROUP BY e.group_id
        ),

        settlements_agg AS (
          SELECT
            s.group_id,
            json_agg(
              json_build_object(
                'settlement_id', s.settlement_id,
                'group_id', s.group_id,
                'from_user', s.from_user,
                'to_user', s.to_user,
                'amount', s.amount,
                'settled_at', s.settled_at,
                'is_paid', s.is_paid,
                'from_user_details', json_build_object(
                  'id', fu.id,
                  'username', fu.username,
                  'first_name', fu.first_name,
                  'last_name', fu.last_name,
                  'email', fu.email,
                  'role', fu.role
                ),
                'to_user_details', json_build_object(
                  'id', tu.id,
                  'username', tu.username,
                  'first_name', tu.first_name,
                  'last_name', tu.last_name,
                  'email', tu.email,
                  'role', tu.role
                )
              )
              ORDER BY s.settled_at DESC
            ) AS settlements
          FROM settlements s
          JOIN users fu ON fu.id = s.from_user
          JOIN users tu ON tu.id = s.to_user
          WHERE s.group_id = $1
          GROUP BY s.group_id
        ),

        -- paid only for members:
paid AS (
  SELECT ue.group_id, ue.paid_by AS user_id, SUM(ue.amount) AS total_paid
  FROM user_expenses ue
  JOIN user_group_members gm ON gm.group_id = ue.group_id AND gm.user_id = ue.paid_by
  WHERE ue.group_id = $1
  GROUP BY ue.group_id, ue.paid_by
),

-- settlements delta only for members:
settlements_delta AS (
  SELECT s.group_id, s.from_user AS user_id, SUM(s.amount) AS delta
  FROM settlements s
  JOIN user_group_members gm ON gm.group_id = s.group_id AND gm.user_id = s.from_user
  WHERE s.group_id = $1 AND s.is_paid = true
  GROUP BY s.group_id, s.from_user

  UNION ALL

  SELECT s.group_id, s.to_user AS user_id, SUM(-s.amount) AS delta
  FROM settlements s
  JOIN user_group_members gm ON gm.group_id = s.group_id AND gm.user_id = s.to_user
  WHERE s.group_id = $1 AND s.is_paid = true
  GROUP BY s.group_id, s.to_user
),


        ${isSplitwise
          ? `
        -- SPLITWISE MODE: equal share
        member_count AS (
          SELECT
            gm.group_id,
            COUNT(*) AS member_count
          FROM user_group_members gm
          WHERE gm.group_id = $1
          GROUP BY gm.group_id
        ),

        total_expense_cte AS (
          SELECT
            ue.group_id,
            COALESCE(SUM(ue.amount), 0) AS total_amount
          FROM user_expenses ue
          WHERE ue.group_id = $1
          GROUP BY ue.group_id
        ),

        user_balance AS (
          SELECT
            gm.group_id,
            u.*,
            COALESCE(p.total_paid, 0)
              - COALESCE(te.total_amount, 0) / NULLIF(mc.member_count, 0)
              + COALESCE(sd.delta, 0) AS balance
          FROM users u
          JOIN user_group_members gm
            ON gm.user_id = u.id
           AND gm.group_id = $1
          LEFT JOIN paid p
            ON p.user_id = u.id
           AND p.group_id = gm.group_id
          LEFT JOIN total_expense_cte te
            ON te.group_id = gm.group_id
          LEFT JOIN member_count mc
            ON mc.group_id = gm.group_id
          LEFT JOIN settlements_delta sd
            ON sd.user_id = u.id
           AND sd.group_id = gm.group_id
        )
        `
          : `
        -- TRICOUNT MODE: use expense_shares
        share AS (
          SELECT
            ue.group_id,
            es.user_id,
            SUM(es.share_amount) AS total_share
          FROM expense_shares es
          JOIN user_expenses ue
            ON ue.expense_id = es.expense_id
          WHERE ue.group_id = $1
          GROUP BY ue.group_id, es.user_id
        ),

        user_balance AS (
          SELECT
            gm.group_id,
            u.*,
            COALESCE(p.total_paid, 0)
              - COALESCE(s.total_share, 0)
              + COALESCE(sd.delta, 0) AS balance
          FROM users u
          JOIN user_group_members gm
            ON gm.user_id = u.id
           AND gm.group_id = $1
          LEFT JOIN paid p
            ON p.user_id = u.id
           AND p.group_id = gm.group_id
          LEFT JOIN share s
            ON s.user_id = u.id
           AND s.group_id = gm.group_id
          LEFT JOIN settlements_delta sd
            ON sd.user_id = u.id
           AND sd.group_id = gm.group_id
        )
        `
        },

        balances_agg AS (
          SELECT
            ub.group_id,
            json_agg(
              json_build_object(
                'id', ub.id,
                'username', ub.username,
                'first_name', ub.first_name,
                'last_name', ub.last_name,
                'email', ub.email,
                'role', ub.role,
                'verified', ub.verified,
                'status', ub.status,
                'balance', ub.balance
              )
              ORDER BY ub.balance DESC
            ) AS balances,
            COALESCE(SUM(ub.balance), 0) AS net_balance
          FROM user_balance ub
          GROUP BY ub.group_id
        )

        SELECT
          gb.*,
          COALESCE(members_agg.members, '[]'::json)         AS members,
          COALESCE(expenses_agg.expenses, '[]'::json)       AS expenses,
          COALESCE(expenses_agg.total_expense, 0)           AS total_expense,
          COALESCE(settlements_agg.settlements, '[]'::json) AS settlements,
          COALESCE(balances_agg.balances, '[]'::json)       AS balances,
          COALESCE(balances_agg.net_balance, 0)             AS net_balance
        FROM group_base gb
        LEFT JOIN members_agg      ON members_agg.group_id = gb.group_id
        LEFT JOIN expenses_agg     ON expenses_agg.group_id = gb.group_id
        LEFT JOIN settlements_agg  ON settlements_agg.group_id = gb.group_id
        LEFT JOIN balances_agg     ON balances_agg.group_id = gb.group_id;
      `;

      const { rows } = await executeQuery(GROUP_DETAILS_QUERY, [groupId]);
      if (rows.length === 0) return null;

      const group = rows[0];
      const balances = Array.isArray(group.balances) ? group.balances : [];
      const recommended_settlements = calculateRecommendedSettlements(balances);

      return {
        ...group,
        recommended_settlements,
      };
    } catch (err) {
      throw err;
    }
  }

  static async createSettlement({ groupId, fromUserId, toUserId, amount }) {
    try {
      const insertSettlementQuery = `
        INSERT INTO settlements (group_id, from_user, to_user, amount, is_paid)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *;
      `;
      const { rows } = await executeQuery(insertSettlementQuery, [
        groupId,
        fromUserId,
        toUserId,
        amount,
      ]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = ExpenseModel;
