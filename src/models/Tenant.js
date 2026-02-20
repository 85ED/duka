const db = require('../config/database');


class Tenant {
    static async create({ accountId, name, document, email, phone, document_url }) {
        const [result] = await db.execute(
            'INSERT INTO tenants (account_id, name, document, email, phone, document_url) VALUES (?, ?, ?, ?, ?, ?)',
            [accountId, name, document, email, phone, document_url]
        );
        return result.insertId;
    }

    static async update(id, accountId, { name, document, email, phone, document_url }) {
        await db.execute(
            'UPDATE tenants SET name = ?, document = ?, email = ?, phone = ?, document_url = ? WHERE id = ? AND account_id = ?',
            [name, document, email, phone, document_url, id, accountId]
        );
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
