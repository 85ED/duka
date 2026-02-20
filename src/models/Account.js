const db = require('../config/database');
const bcrypt = require('bcrypt');

class Account {
    static async create(name, type = 'client') {
        const [result] = await db.execute(
            'INSERT INTO accounts (name, type) VALUES (?, ?)',
            [name, type]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.execute(
            'SELECT * FROM accounts WHERE type = "client" AND deleted_at IS NULL ORDER BY created_at DESC'
        );
        return rows;
    }
}

module.exports = Account;
