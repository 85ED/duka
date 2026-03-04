const db = require('../config/database');

class Charge {
    static async create({ accountId, contractId, referenceMonth, dueDate }) {
        // 1. Get Contract to know Rent Amount
        const [contracts] = await db.execute(
            'SELECT rent_amount FROM contracts WHERE id = ? AND account_id = ?',
            [contractId, accountId]
        );
        if (!contracts.length) throw new Error('Contract not found');

        const rentAmount = contracts[0].rent_amount;

        // Transaction to ensure Charge + Item(Rent) are created together
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [chargeResult] = await connection.execute(
                'INSERT INTO charges (account_id, contract_id, reference_month, due_date, total_amount, status) VALUES (?, ?, ?, ?, ?, "pending")',
                [accountId, contractId, referenceMonth, dueDate, rentAmount]
            );
            const chargeId = chargeResult.insertId;

            await connection.execute(
                'INSERT INTO charge_items (charge_id, description, amount, type) VALUES (?, "Aluguel", ?, "rent")',
                [chargeId, rentAmount]
            );

            // Adicionar servicos recorrentes ativos
            const [serviceRows] = await connection.execute(
                `SELECT cs.price, s.name, s.default_price
                 FROM contract_services cs
                 JOIN services s ON cs.service_id = s.id
                 WHERE cs.contract_id = ?
                   AND cs.status = 'active'
                   AND cs.start_date <= ?
                   AND (cs.end_date IS NULL OR cs.end_date >= ?)
                   AND s.status = 'active'`,
                [contractId, dueDate, dueDate]
            );

            for (const service of serviceRows) {
                const amount = service.price !== null ? service.price : service.default_price;
                await connection.execute(
                    'INSERT INTO charge_items (charge_id, description, amount, type) VALUES (?, ?, ?, "service")',
                    [chargeId, service.name, amount]
                );
            }

            await connection.execute(
                'UPDATE charges SET total_amount = (SELECT SUM(amount) FROM charge_items WHERE charge_id = ?) WHERE id = ?',
                [chargeId, chargeId]
            );

            await connection.commit();
            return chargeId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async addItem(chargeId, accountId, { description, amount, type }) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [charges] = await connection.execute(
                'SELECT status FROM charges WHERE id = ? AND account_id = ? FOR UPDATE',
                [chargeId, accountId]
            );

            if (!charges.length) throw new Error('Charge not found');
            if (charges[0].status !== 'pending') throw new Error('Cannot add items to non-pending charge');

            await connection.execute(
                'INSERT INTO charge_items (charge_id, description, amount, type) VALUES (?, ?, ?, ?)',
                [chargeId, description, amount, type]
            );

            await connection.execute(
                'UPDATE charges SET total_amount = (SELECT SUM(amount) FROM charge_items WHERE charge_id = ?) WHERE id = ?',
                [chargeId, chargeId]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async voidById(chargeId, accountId) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [rows] = await connection.execute(
                'SELECT status FROM charges WHERE id = ? AND account_id = ? FOR UPDATE',
                [chargeId, accountId]
            );

            if (!rows.length) throw new Error('Charge not found');
            if (rows[0].status === 'paid') throw new Error('Cannot void a paid charge');

            await connection.execute(
                'UPDATE charges SET status = "void" WHERE id = ? AND account_id = ?',
                [chargeId, accountId]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(id, accountId) {
        // Dynamic Status: If pending and due_date < today, show overdue
        const sql = `
            SELECT c.id, c.contract_id, c.reference_month, c.due_date, c.total_amount, c.created_at,
                   CASE 
                       WHEN c.status = 'pending' AND c.due_date < CURDATE() THEN 'overdue' 
                       ELSE c.status 
                   END as status,
                   JSON_ARRAYAGG(
                        CASE WHEN ci.id IS NOT NULL THEN
                           JSON_OBJECT('id', ci.id, 'description', ci.description, 'amount', ci.amount, 'type', ci.type)
                        ELSE NULL END
                   ) as items,
                   (SELECT COALESCE(SUM(p.amount_paid), 0) FROM payments p WHERE p.charge_id = c.id AND p.status = 'confirmed') as total_paid
            FROM charges c
            LEFT JOIN charge_items ci ON c.id = ci.charge_id
            WHERE c.id = ? AND c.account_id = ?
            GROUP BY c.id
        `;
        const [rows] = await db.execute(sql, [id, accountId]);
        if (rows.length && rows[0].items && rows[0].items[0] === null) {
            rows[0].items = []; // Handle empty items case properly
        }
        return rows[0];
    }

    static async findAll(accountId, { status, month } = {}) {
        let query = `
            SELECT c.id, c.contract_id, c.reference_month, c.due_date, c.total_amount,
                   CASE 
                       WHEN c.status = 'pending' AND c.due_date < CURDATE() THEN 'overdue' 
                       ELSE c.status 
                   END as status,
                   t.name as tenant_name,
                   COALESCE(
                       CONCAT(e.name, ' - ', u.identifier),
                       p.address
                   ) as property_address,
                   (SELECT COALESCE(SUM(pm.amount_paid), 0) FROM payments pm WHERE pm.charge_id = c.id AND pm.status = 'confirmed') as total_paid,
                   -- Cálculo de juros
                   CASE 
                       WHEN c.status != 'paid' AND c.due_date < CURDATE() 
                       THEN DATEDIFF(CURDATE(), c.due_date)
                       ELSE 0
                   END as dias_atraso,
                   CASE 
                       WHEN c.status != 'paid' AND c.due_date < CURDATE() 
                       THEN ROUND(c.total_amount * (COALESCE(cnt.late_fee_daily, 0.0333) / 100) * DATEDIFF(CURDATE(), c.due_date), 2)
                       ELSE 0
                   END as juros,
                   CASE 
                       WHEN c.status != 'paid' AND c.due_date < CURDATE() 
                       THEN ROUND(c.total_amount + (c.total_amount * (COALESCE(cnt.late_fee_daily, 0.0333) / 100) * DATEDIFF(CURDATE(), c.due_date)), 2)
                       ELSE c.total_amount
                   END as valor_com_juros,
                   -- Serviços adicionais (subconsulta com ícone)
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('description', ci.description, 'amount', ci.amount, 'type', ci.type, 'icon', COALESCE(s.icon, 'fa-solid fa-circle-check')))
                    FROM charge_items ci
                    LEFT JOIN services s ON s.name = ci.description AND s.account_id = c.account_id
                    WHERE ci.charge_id = c.id AND ci.type = 'service') as services
            FROM charges c
            JOIN contracts cnt ON c.contract_id = cnt.id
            JOIN tenants t ON cnt.tenant_id = t.id
            LEFT JOIN units u ON cnt.unit_id = u.id
            LEFT JOIN enterprises e ON u.enterprise_id = e.id
            LEFT JOIN properties p ON cnt.property_id = p.id
            WHERE c.account_id = ?
              AND c.status != 'void'
        `;
        const params = [accountId];

        if (month) {
            query += ' AND DATE_FORMAT(c.reference_month, "%Y-%m") = ?';
            params.push(month);
        }

        // Filtering by computed status is tricky in WHERE, so we verify logic or use HAVING
        // But for simplicity/performance on small SaaS, we can filter in WHERE using raw logic
        if (status) {
            if (status === 'overdue') {
                query += " AND (c.status = 'overdue' OR (c.status = 'pending' AND c.due_date < CURDATE()))";
            } else if (status === 'pending') {
                query += " AND (c.status = 'pending' AND c.due_date >= CURDATE())";
            } else {
                query += ' AND c.status = ?';
                params.push(status);
            }
        }

        query += ' ORDER BY c.due_date DESC, c.id DESC';

        const [rows] = await db.execute(query, params);
        // Clean up JSON arrays with null values
        rows.forEach(row => {
            if (row.services) {
                try {
                    if (typeof row.services === 'string') {
                        const parsed = JSON.parse(row.services);
                        row.services = parsed && parsed[0] !== null ? parsed : [];
                    } else if (Array.isArray(row.services) && row.services[0] === null) {
                        row.services = [];
                    } else {
                        row.services = row.services || [];
                    }
                } catch (e) {
                    row.services = [];
                }
            } else {
                row.services = [];
            }
        });
        return rows;
    }
}

module.exports = Charge;
