const db = require('../config/database');

class Property {
    static async create({ accountId, address, description }) {
        const [result] = await db.execute(
            'INSERT INTO properties (account_id, address, description) VALUES (?, ?, ?)',
            [accountId, address, description]
        );
        return result.insertId;
    }

    static async findAll(accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM properties WHERE account_id = ? ORDER BY created_at DESC',
            [accountId]
        );
        return rows;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM properties WHERE id = ? AND account_id = ?',
            [id, accountId]
        );
        return rows[0];
    }
}

module.exports = Property;
