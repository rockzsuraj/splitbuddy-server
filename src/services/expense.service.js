// services/expense.service.js
const ExpenseModel = require('../models/expense.model');

class ExpenseService {
  static async addExpense({ groupId, paidBy, amount, description, expenseDate }) {
    const row = await ExpenseModel.addExpense(groupId, paidBy, amount, description, expenseDate);
    return row;
  }
  static async updateExpense({ groupId, expenseId, paidBy, amount, description, expenseDate }) {
    const row = await ExpenseModel.updateExpense(groupId, expenseId, {paidBy, amount, description, expenseDate});
    return row;
  }

  static async deleteExpense({ groupId, expenseId }) {
    await ExpenseModel.deleteExpense(groupId, expenseId);
  }

  static async getGroupBalances(groupId, mode) {
    const rows = await ExpenseModel.getGroupBalances(groupId, mode);  
    return rows;
  }

  static async getGroupDetails(groupId) {
    const row = await ExpenseModel.getGroupDetails(groupId);  
    return row;
  }

  static async createSettlement({ groupId, fromUserId, toUserId, amount }) {
    const row = await ExpenseModel.createSettlement({ groupId, fromUserId, toUserId, amount });
    return row;
  }
}

module.exports = ExpenseService;
