const db = require('../config/database');

class Unit {
    static async create({ accountId, enterpriseId, identifier, description, areaSqm }) {
        const [result] = await db.execute(
            'INSERT INTO units (account_id, enterprise_id, identifier, description, area_sqm) VALUES (?, ?, ?, ?, ?)',
            [accountId, enterpriseId, identifier, description || null, areaSqm || null]
        );
        return result.insertId;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            `SELECT u.*, e.name as enterprise_name, e.address as enterprise_address,
                    c.id as contract_id, c.status as contract_status, c.rent_amount,
                    t.name as tenant_name, t.phone as tenant_phone
             FROM units u
             JOIN enterprises e ON u.enterprise_id = e.id
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             LEFT JOIN tenants t ON c.tenant_id = t.id
             WHERE u.id = ? AND u.account_id = ? AND u.deleted_at IS NULL`,
            [id, accountId]
        );
        return rows[0];
    }

    static async findByEnterprise(enterpriseId, accountId) {
        const [rows] = await db.execute(
            `SELECT u.*, 
                    c.id as contract_id, c.status as contract_status, c.rent_amount, c.end_date,
                    t.name as tenant_name,
                    CASE 
                        WHEN c.id IS NULL THEN 'vacant'
                        WHEN EXISTS (
                            SELECT 1 FROM charges ch 
                            WHERE ch.contract_id = c.id AND ch.status = 'overdue'
                        ) THEN 'overdue'
                        WHEN c.end_date IS NOT NULL AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring'
                        ELSE 'occupied'
                    END as unit_status
             FROM units u
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             LEFT JOIN tenants t ON c.tenant_id = t.id
             WHERE u.enterprise_id = ? AND u.account_id = ? AND u.deleted_at IS NULL
             ORDER BY u.identifier ASC`,
            [enterpriseId, accountId]
        );
        return rows;
    }

    static async findAll(accountId) {
        const [rows] = await db.execute(
            `SELECT u.*, e.name as enterprise_name,
                    c.id as contract_id, c.status as contract_status, c.rent_amount,
                    t.name as tenant_name,
                    CASE 
                        WHEN c.id IS NULL THEN 'vacant'
                        WHEN EXISTS (
                            SELECT 1 FROM charges ch 
                            WHERE ch.contract_id = c.id AND ch.status = 'overdue'
                        ) THEN 'overdue'
                        WHEN c.end_date IS NOT NULL AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring'
                        ELSE 'occupied'
                    END as unit_status
             FROM units u
             JOIN enterprises e ON u.enterprise_id = e.id AND e.deleted_at IS NULL
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             LEFT JOIN tenants t ON c.tenant_id = t.id
             WHERE u.account_id = ? AND u.deleted_at IS NULL
             ORDER BY e.name ASC, u.identifier ASC`,
            [accountId]
        );
        return rows;
    }

    static async update(id, accountId, { identifier, description, areaSqm }) {
        const [result] = await db.execute(
            `UPDATE units SET identifier = ?, description = ?, area_sqm = ?
             WHERE id = ? AND account_id = ? AND deleted_at IS NULL`,
            [identifier, description || null, areaSqm || null, id, accountId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, accountId) {
        // Soft delete
        const [result] = await db.execute(
            `UPDATE units SET deleted_at = NOW()
             WHERE id = ? AND account_id = ? AND deleted_at IS NULL`,
            [id, accountId]
        );
        return result.affectedRows > 0;
    }

    // Estatísticas para dashboard
    static async getStats(accountId) {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(DISTINCT u.id) as total_units,
                COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN u.id END) as occupied_units,
                COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM charges ch 
                        WHERE ch.contract_id = c.id AND ch.status = 'overdue'
                    ) THEN u.id 
                END) as overdue_units,
                COUNT(DISTINCT CASE 
                    WHEN c.end_date IS NOT NULL AND c.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
                    THEN u.id 
                END) as expiring_units
             FROM units u
             LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
             WHERE u.account_id = ? AND u.deleted_at IS NULL`,
            [accountId]
        );
        return rows[0];
    }
}

module.exports = Unit;
