const db = require('../config/database');

class ContractService {
    static async listByContract(contractId, accountId) {
        const [rows] = await db.execute(
            `SELECT cs.id, cs.contract_id, cs.service_id, cs.price, cs.start_date, cs.end_date, cs.status,
                    s.name as service_name, s.default_price
             FROM contract_services cs
             JOIN services s ON cs.service_id = s.id
             JOIN contracts c ON cs.contract_id = c.id
             WHERE cs.contract_id = ? AND c.account_id = ?
             ORDER BY cs.created_at DESC`,
            [contractId, accountId]
        );
        return rows;
    }

    static async add({ contractId, serviceId, price, startDate }) {
        const [result] = await db.execute(
            `INSERT INTO contract_services (contract_id, service_id, price, start_date, status)
             VALUES (?, ?, ?, ?, 'active')`,
            [contractId, serviceId, price, startDate]
        );
        return result.insertId;
    }

    static async deactivate({ id, accountId }) {
        await db.execute(
            `UPDATE contract_services cs
             JOIN contracts c ON cs.contract_id = c.id
             SET cs.status = 'inactive', cs.end_date = CURDATE()
             WHERE cs.id = ? AND c.account_id = ?`,
            [id, accountId]
        );
    }

    static async listActiveForCharge({ contractId, dueDate }) {
        const [rows] = await db.execute(
            `SELECT cs.id, cs.price, s.name, s.default_price
             FROM contract_services cs
             JOIN services s ON cs.service_id = s.id
             WHERE cs.contract_id = ?
               AND cs.status = 'active'
               AND cs.start_date <= ?
               AND (cs.end_date IS NULL OR cs.end_date >= ?)
               AND s.status = 'active'`,
            [contractId, dueDate, dueDate]
        );
        return rows;
    }
}

module.exports = ContractService;
