const ExpenseService = require("../services/expense.service");


class ExpenseController {
  static async addExpense(req, res) {
    try {
      const { groupId } = req.params;
      const { amount, description, expense_date, paidBy } = req.body;

      const result = await ExpenseService.addExpense({
        groupId: Number(groupId),
        paidBy: paidBy,
        amount: Number(amount),
        description,
        expenseDate: expense_date || new Date().toISOString().slice(0, 10),
      });

      res.status(201).json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateExpense(req, res) {
    try {
      const { groupId, expenseId } = req.params;
      const { amount, description, expense_date, paidBy } = req.body;

      const result = await ExpenseService.updateExpense({
        groupId: Number(groupId),
        expenseId: Number(expenseId),
        paidBy: paidBy,
        amount: amount !== undefined ? Number(amount) : undefined,
        description,
        expenseDate: expense_date,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async deleteExpense(req, res) {
    try {
      const { groupId, expenseId } = req.params;

      await ExpenseService.deleteExpense({
        groupId: Number(groupId),
        expenseId: Number(expenseId),
      });

      res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getBalances(req, res) {
    try {
      const { groupId } = req.params;
      const mode = req.query.mode === 'splitwise' ? 'splitwise' : 'tricount';
      const balances = await ExpenseService.getGroupBalances(Number(groupId), mode);
      res.json({ success: true, balances });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async createSettlement(req, res) {
    try {
      const { groupId } = req.params;
      const { from_user_id, to_user_id, amount } = req.body;

      const group_id_num = Number(groupId);
      const fromUserId = Number(from_user_id);
      const toUserId = Number(to_user_id);
      const amountNum = Number(amount);

      if (!group_id_num || !fromUserId || !toUserId || !amountNum) {
        return res
          .status(400)
          .json({ success: false, message: 'groupId, from_user_id, to_user_id, amount are required' });
      }

      // 1️⃣ Get current group state with recommended_settlements
      const groupDetails = await ExpenseService.getGroupDetails(group_id_num);
      const recs = (groupDetails?.recommended_settlements || [])
      // 2️⃣ Check if there is something left to settle between these two
      const match = recs.find(
        (r) => r.from_user_id === fromUserId && r.to_user_id === toUserId
      );

      if (!match) {
        // nothing pending anymore ⇒ avoid duplicate rows
        return res.status(409).json({
          success: false,
          message: 'Nothing left to settle between these members',
        });
      }

      // 3️⃣ Never allow settling more than remaining recommended amount
      const amountToSettle = Math.min(amountNum, Number(match.amount));

      // 4️⃣ Create settlement
      const settlement = await ExpenseService.createSettlement({
        groupId: group_id_num,
        fromUserId,
        toUserId,
        amount: amountToSettle,
      });

      // 5️⃣ Fetch updated group (balances, settlements, recommended_settlements will be recalculated)
      const updatedGroup = await ExpenseService.getGroupDetails(group_id_num);

      return res.status(201).json({
        success: true,
        message: 'Settlement recorded successfully',
        data: {
          settlement,
          group: updatedGroup,
        },
      });
    } catch (err) {
      console.error('createSettlement error', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = ExpenseController;
