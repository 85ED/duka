const db = require('../config/database');

class Service {
    static async list(accountId) {
        const [rows] = await db.execute(
            'SELECT id, name, icon, default_price, status FROM services WHERE account_id = ? ORDER BY name',
            [accountId]
        );
        return rows;
    }

    static async create({ accountId, name, icon, defaultPrice }) {
        const [result] = await db.execute(
            'INSERT INTO services (account_id, name, icon, default_price) VALUES (?, ?, ?, ?)',
            [accountId, name, icon || 'fa-solid fa-circle-check', defaultPrice]
        );
        return result.insertId;
    }

    static async update({ accountId, id, name, icon, defaultPrice, status }) {
        const fields = [];
        const params = [];

        if (name !== undefined) {
            fields.push('name = ?');
            params.push(name);
        }
        if (icon !== undefined) {
            fields.push('icon = ?');
            params.push(icon);
        }
        if (defaultPrice !== undefined) {
            fields.push('default_price = ?');
            params.push(defaultPrice);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            params.push(status);
        }

        if (fields.length === 0) return;

        params.push(id, accountId);
        await db.execute(
            `UPDATE services SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`,
            params
        );
    }
}

module.exports = Service;
