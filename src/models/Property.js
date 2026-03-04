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

    static async update(id, accountId, { address, description }) {
        const [result] = await db.execute(
            'UPDATE properties SET address = ?, description = ? WHERE id = ? AND account_id = ?',
            [address, description || null, id, accountId]
        );
        return result.affectedRows;
    }
}

module.exports = Property;
