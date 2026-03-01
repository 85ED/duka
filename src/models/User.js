const db = require('../config/database');

class User {
    static async create({ accountId, name, email, password, role = 'member', primaryUserId = null }) {
        const [result] = await db.execute(
            'INSERT INTO users (account_id, name, email, password, role, primary_user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [accountId, name, email, password, role, primaryUserId]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        // Only active users
        const [rows] = await db.execute(
            'SELECT id, name, email, password, role, account_id, primary_user_id FROM users WHERE email = ? AND deleted_at IS NULL',
            [email]
        );
        return rows[0];
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            'SELECT id, name, email, role, account_id, primary_user_id FROM users WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
            [id, accountId]
        );
        return rows[0];
    }

    static async findAll(accountId, role = null) {
        let query = 'SELECT id, name, email, role, account_id, primary_user_id FROM users WHERE account_id = ? AND deleted_at IS NULL';
        const params = [accountId];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        query += ' ORDER BY name ASC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    // Get subsidiary users (partners created by this primary user)
    static async getPartnerUsers(primaryUserId, accountId) {
        const [rows] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE primary_user_id = ? AND account_id = ? AND deleted_at IS NULL ORDER BY name ASC',
            [primaryUserId, accountId]
        );
        return rows;
    }

    // Check if user is admin
    static async isAdmin(userId, accountId) {
        const [rows] = await db.execute(
            'SELECT role FROM users WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
            [userId, accountId]
        );

        if (!rows.length) return false;
        return rows[0].role === 'admin' || rows[0].role === 'client_admin';
    }

    // Soft delete user
    static async softDelete(userId, accountId) {
        await db.execute(
            'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
            [userId, accountId]
        );
    }
}

module.exports = User;
