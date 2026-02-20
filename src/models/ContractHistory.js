const db = require('../config/database');

class ContractHistory {
    static async logReplacement({ accountId, oldContractId, newContractId, replacedOn, reason }) {
        const [result] = await db.execute(
            'INSERT INTO contract_history (account_id, old_contract_id, new_contract_id, replaced_on, reason) VALUES (?, ?, ?, ?, ?)',
            [accountId, oldContractId, newContractId, replacedOn, reason]
        );
        return result.insertId;
    }

    static async findById(id, accountId) {
        const [rows] = await db.execute(
            `SELECT ch.*, 
                    oc.property_id as property_id,
                    ot.name as old_tenant_name,
                    nt.name as new_tenant_name,
                    p.address as property_address
             FROM contract_history ch
             JOIN contracts oc ON ch.old_contract_id = oc.id
             JOIN contracts nc ON ch.new_contract_id = nc.id
             JOIN tenants ot ON oc.tenant_id = ot.id
             JOIN tenants nt ON nc.tenant_id = nt.id
             JOIN properties p ON oc.property_id = p.id
             WHERE ch.id = ? AND ch.account_id = ?`,
            [id, accountId]
        );
        return rows[0];
    }

    static async findByProperty(propertyId, accountId) {
        const [rows] = await db.execute(
            `SELECT ch.*,
                    ot.name as old_tenant_name,
                    nt.name as new_tenant_name
             FROM contract_history ch
             JOIN contracts oc ON ch.old_contract_id = oc.id
             JOIN contracts nc ON ch.new_contract_id = nc.id
             JOIN tenants ot ON oc.tenant_id = ot.id
             JOIN tenants nt ON nc.tenant_id = nt.id
             WHERE oc.property_id = ? AND ch.account_id = ?
             ORDER BY ch.replaced_on DESC`,
            [propertyId, accountId]
        );
        return rows;
    }

    static async findAll(accountId) {
        const [rows] = await db.execute(
            `SELECT ch.*,
                    p.address as property_address,
                    ot.name as old_tenant_name,
                    nt.name as new_tenant_name
             FROM contract_history ch
             JOIN contracts oc ON ch.old_contract_id = oc.id
             JOIN contracts nc ON ch.new_contract_id = nc.id
             JOIN tenants ot ON oc.tenant_id = ot.id
             JOIN tenants nt ON nc.tenant_id = nt.id
             JOIN properties p ON oc.property_id = p.id
             WHERE ch.account_id = ?
             ORDER BY ch.replaced_on DESC`,
            [accountId]
        );
        return rows;
    }
}

module.exports = ContractHistory;
