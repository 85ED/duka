const db = require('../config/database');

class Tenant {
    static async create({ accountId, name, document, email, phone }) {
        const [result] = await db.execute(
            'INSERT INTO tenants (account_id, name, document, email, phone) VALUES (?, ?, ?, ?, ?)',
            [accountId, name, document, email, phone]
        );
        return result.insertId;
    }

    static async findAll(accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM tenants WHERE account_id = ? ORDER BY name ASC',
            [accountId]
        );
        return rows;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM tenants WHERE id = ? AND account_id = ?',
            [id, accountId]
        );
        return rows[0];
    }
}

module.exports = Tenant;
