const db = require('../config/database');

class Expense {
    static async create({ accountId, propertyId, description, amount, paidByUserId, expenseDate, category }) {
        const [result] = await db.execute(
            'INSERT INTO expenses (account_id, property_id, description, amount, paid_by_user_id, expense_date, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, "pending")',
            [accountId, propertyId, description, amount, paidByUserId, expenseDate, category]
        );
        return result.insertId;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM expenses WHERE id = ? AND account_id = ?',
            [id, accountId]
        );
        return rows[0];
    }

    static async findAll(accountId, { propertyId, status, month } = {}) {
        let query = `
            SELECT e.*, 
                   p.address as property_address,
                   u.name as paid_by_user_name
            FROM expenses e
            JOIN properties p ON e.property_id = p.id
            JOIN users u ON e.paid_by_user_id = u.id
            WHERE e.account_id = ?
        `;
        const params = [accountId];

        if (propertyId) {
            query += ' AND e.property_id = ?';
            params.push(propertyId);
        }

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (month) {
            query += ' AND DATE_FORMAT(e.expense_date, "%Y-%m") = ?';
            params.push(month);
        }

        query += ' ORDER BY e.expense_date DESC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async updateStatus(id, accountId, status) {
        await db.execute(
            'UPDATE expenses SET status = ? WHERE id = ? AND account_id = ?',
            [status, id, accountId]
        );
    }

    static async getPropertyExpenses(propertyId, accountId, month = null) {
        let query = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE property_id = ? AND account_id = ? AND status = 'paid'
        `;
        const params = [propertyId, accountId];

        if (month) {
            query += ' AND DATE_FORMAT(expense_date, "%Y-%m") = ?';
            params.push(month);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total || 0;
    }
}

module.exports = Expense;
