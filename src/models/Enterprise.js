const db = require('../config/database');

class Enterprise {
    static async create({ accountId, name, address, description }) {
        const [result] = await db.execute(
            'INSERT INTO enterprises (account_id, name, address, description) VALUES (?, ?, ?, ?)',
            [accountId, name, address || null, description || null]
        );
        return result.insertId;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            `SELECT e.*, 
                    COUNT(DISTINCT u.id) as units_count,
                    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as occupied_count
             FROM enterprises e
             LEFT JOIN units u ON e.id = u.enterprise_id AND u.deleted_at IS NULL
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             WHERE e.id = ? AND e.account_id = ? AND e.deleted_at IS NULL
             GROUP BY e.id`,
            [id, accountId]
        );
        return rows[0];
    }

    static async findAll(accountId) {
        const [rows] = await db.execute(
            `SELECT e.*, 
                    COUNT(DISTINCT u.id) as units_count,
                    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as occupied_count
             FROM enterprises e
             LEFT JOIN units u ON e.id = u.enterprise_id AND u.deleted_at IS NULL
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             WHERE e.account_id = ? AND e.deleted_at IS NULL
             GROUP BY e.id
             ORDER BY e.name ASC`,
            [accountId]
        );
        return rows;
    }

    static async update(id, accountId, { name, address, description }) {
        const [result] = await db.execute(
            `UPDATE enterprises SET name = ?, address = ?, description = ?
             WHERE id = ? AND account_id = ? AND deleted_at IS NULL`,
            [name, address || null, description || null, id, accountId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, accountId) {
        // Soft delete
        const [result] = await db.execute(
            `UPDATE enterprises SET deleted_at = NOW()
             WHERE id = ? AND account_id = ? AND deleted_at IS NULL`,
            [id, accountId]
        );
        return result.affectedRows > 0;
    }

    static async getWithUnits(id, accountId) {
        const enterprise = await this.findById(id, accountId);
        if (!enterprise) return null;

        const [units] = await db.execute(
            `SELECT u.*, 
                    c.id as contract_id,
                    c.status as contract_status,
                    t.name as tenant_name,
                    c.rent_amount,
                    ch.status as charge_status,
                    ch.due_date
             FROM units u
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             LEFT JOIN tenants t ON c.tenant_id = t.id
             LEFT JOIN charges ch ON c.id = ch.contract_id AND ch.status IN ('pending', 'overdue')
             WHERE u.enterprise_id = ? AND u.account_id = ? AND u.deleted_at IS NULL
             ORDER BY u.identifier ASC`,
            [id, accountId]
        );

        enterprise.units = units;
        return enterprise;
    }
}

module.exports = Enterprise;
