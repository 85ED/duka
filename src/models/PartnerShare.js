const db = require('../config/database');

class PartnerShare {
    static async create({ accountId, primaryUserId, partnerUserId, percentage }) {
        if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }

        const [result] = await db.execute(
            'INSERT INTO partner_shares (account_id, primary_user_id, partner_user_id, percentage) VALUES (?, ?, ?, ?)',
            [accountId, primaryUserId, partnerUserId, percentage]
        );
        return result.insertId;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM partner_shares WHERE id = ? AND account_id = ?',
            [id, accountId]
        );
        return rows[0];
    }

    static async findByUsers(accountId, primaryUserId, partnerUserId) {
        const [rows] = await db.execute(
            'SELECT * FROM partner_shares WHERE account_id = ? AND primary_user_id = ? AND partner_user_id = ? AND status = "active"',
            [accountId, primaryUserId, partnerUserId]
        );
        return rows[0];
    }

    // Get all partners of a primary user
    static async getPartnersOf(accountId, primaryUserId) {
        const [rows] = await db.execute(
            `SELECT ps.*, u.name as partner_name, u.email as partner_email
             FROM partner_shares ps
             JOIN users u ON ps.partner_user_id = u.id
             WHERE ps.account_id = ? AND ps.primary_user_id = ? AND ps.status = "active"
             ORDER BY ps.percentage DESC`,
            [accountId, primaryUserId]
        );
        return rows;
    }

    // Get profit shares for a user (including as primary and as partner)
    static async getProfitShares(accountId, userId) {
        // Query own profit + partner profits
        const [rows] = await db.execute(
            `SELECT 
                ps.id,
                ps.primary_user_id,
                ps.partner_user_id,
                ps.percentage,
                up.name as primary_user_name,
                up.email as primary_user_email,
                up2.name as partner_user_name,
                up2.email as partner_user_email
             FROM partner_shares ps
             JOIN users up ON ps.primary_user_id = up.id
             JOIN users up2 ON ps.partner_user_id = up2.id
             WHERE ps.account_id = ? AND (ps.primary_user_id = ? OR ps.partner_user_id = ?) AND ps.status = "active"
             ORDER BY ps.created_at ASC`,
            [accountId, userId, userId]
        );
        return rows;
    }

    static async updatePercentage(id, accountId, percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }

        await db.execute(
            'UPDATE partner_shares SET percentage = ? WHERE id = ? AND account_id = ?',
            [percentage, id, accountId]
        );
    }

    static async deactivate(id, accountId) {
        await db.execute(
            'UPDATE partner_shares SET status = "inactive" WHERE id = ? AND account_id = ?',
            [id, accountId]
        );
    }
}

module.exports = PartnerShare;
