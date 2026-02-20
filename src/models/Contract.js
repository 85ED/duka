const db = require('../config/database');
const ContractHistory = require('./ContractHistory');

class Contract {
    // Suporta tanto unit_id (novo) quanto property_id (legado)
    static async create({ accountId, unitId, propertyId, tenantId, startDate, endDate, rentAmount, contractAddress, contractUrl }) {
        // Determine which field to use
        const locationField = unitId ? 'unit_id' : 'property_id';
        const locationValue = unitId || propertyId;

        // Enforce: One active contract per unit/property
        const [activeContracts] = await db.execute(
            `SELECT id FROM contracts WHERE ${locationField} = ? AND status = "active" AND account_id = ?`,
            [locationValue, accountId]
        );

        if (activeContracts.length > 0) {
            throw new Error(unitId ? 'Unit already has an active contract' : 'Property already has an active contract');
        }

        const [result] = await db.execute(
            `INSERT INTO contracts (account_id, ${locationField}, tenant_id, contract_address, contract_url, start_date, end_date, rent_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")`,
            [accountId, locationValue, tenantId, contractAddress || null, contractUrl || null, startDate, endDate, rentAmount]
        );
        return result.insertId;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            `SELECT c.*, 
                    u.identifier as unit_identifier, u.description as unit_description,
                    e.name as enterprise_name, e.address as enterprise_address,
                    p.address as property_address, 
                    t.name as tenant_name, t.phone as tenant_phone, t.email as tenant_email
             FROM contracts c
             LEFT JOIN units u ON c.unit_id = u.id
             LEFT JOIN enterprises e ON u.enterprise_id = e.id
             LEFT JOIN properties p ON c.property_id = p.id
             JOIN tenants t ON c.tenant_id = t.id
             WHERE c.id = ? AND c.account_id = ?`,
            [id, accountId]
        );
        return rows[0];
    }

    static async updateStatus(id, accountId, status) {
        await db.execute(
            'UPDATE contracts SET status = ? WHERE id = ? AND account_id = ?',
            [status, id, accountId]
        );
    }

    // Helper to terminate a contract
    static async terminate(id, accountId) {
        return this.updateStatus(id, accountId, 'terminated');
    }

    // Replace a tenant/contract with a new one
    static async replace(oldContractId, { accountId, unitId, propertyId, tenantId, startDate, endDate, rentAmount, reason, contractAddress, contractUrl }) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get old contract
            const [oldContractRows] = await connection.execute(
                'SELECT * FROM contracts WHERE id = ? AND account_id = ? FOR UPDATE',
                [oldContractId, accountId]
            );

            if (!oldContractRows.length) {
                throw new Error('Contract not found');
            }

            const oldContract = oldContractRows[0];
            const locationField = unitId ? 'unit_id' : 'property_id';
            const locationValue = unitId || propertyId || oldContract.unit_id || oldContract.property_id;
            const newContractAddress = contractAddress || oldContract.contract_address || null;
            const newContractUrl = contractUrl || oldContract.contract_url || null;

            // Create new contract
            const [newContractResult] = await connection.execute(
                `INSERT INTO contracts (account_id, ${locationField}, tenant_id, contract_address, contract_url, start_date, end_date, rent_amount, status, previous_contract_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active", ?)`,
                [accountId, locationValue, tenantId, newContractAddress, newContractUrl, startDate, endDate, rentAmount, oldContractId]
            );

            const newContractId = newContractResult.insertId;

            // Mark old contract as replaced
            await connection.execute(
                'UPDATE contracts SET status = "replaced", replaced_on = CURDATE() WHERE id = ?',
                [oldContractId]
            );

            // Log replacement in contract_history
            await connection.execute(
                'INSERT INTO contract_history (account_id, old_contract_id, new_contract_id, replaced_on, reason) VALUES (?, ?, ?, CURDATE(), ?)',
                [accountId, oldContractId, newContractId, reason]
            );

            await connection.commit();
            return newContractId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Apply rent adjustment
    static async applyAdjustment(id, accountId, percentage) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [contracts] = await connection.execute(
                'SELECT rent_amount FROM contracts WHERE id = ? AND account_id = ? FOR UPDATE',
                [id, accountId]
            );

            if (!contracts.length) {
                throw new Error('Contract not found');
            }

            const oldAmount = contracts[0].rent_amount;
            const newAmount = (oldAmount * (100 + percentage)) / 100;

            await connection.execute(
                'UPDATE contracts SET rent_amount = ?, adjustment_percentage = ?, last_adjustment_date = CURDATE() WHERE id = ?',
                [newAmount, percentage, id]
            );

            await connection.commit();
            return { oldAmount, newAmount, percentage };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findAll(accountId) {
        const [rows] = await db.execute(
            `SELECT c.*, 
                    COALESCE(CONCAT(e.name, ' - ', u.identifier), p.address) as location_name,
                    u.identifier as unit_identifier,
                    e.name as enterprise_name,
                    p.address as property_address, 
                    t.name as tenant_name 
             FROM contracts c
             LEFT JOIN units u ON c.unit_id = u.id
             LEFT JOIN enterprises e ON u.enterprise_id = e.id
             LEFT JOIN properties p ON c.property_id = p.id
             JOIN tenants t ON c.tenant_id = t.id
             WHERE c.account_id = ?
             ORDER BY c.status, c.created_at DESC`,
            [accountId]
        );
        return rows;
    }

    // Find active contract for a unit
    static async findActiveByUnit(unitId, accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM contracts WHERE unit_id = ? AND account_id = ? AND status = "active"',
            [unitId, accountId]
        );
        return rows[0];
    }

    // Find active contract for a property (legado)
    static async findActiveByProperty(propertyId, accountId) {
        const [rows] = await db.execute(
            'SELECT * FROM contracts WHERE property_id = ? AND account_id = ? AND status = "active"',
            [propertyId, accountId]
        );
        return rows[0];
    }

    // Update contract fields
    static async update(id, accountId, updateData) {
        const allowedFields = ['contract_url', 'contract_address', 'rent_amount', 'end_date', 'due_day', 'late_fee_daily', 'late_fee_percent'];
        const updates = {};

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                updates[key] = updateData[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return false;
        }

        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id, accountId);

        const result = await db.execute(
            `UPDATE contracts SET ${setClause} WHERE id = ? AND account_id = ?`,
            values
        );

        return result[0].affectedRows > 0;
    }
}

module.exports = Contract;

