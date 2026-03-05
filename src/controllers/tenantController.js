const db = require('../config/database');
const Tenant = require('../models/Tenant');

module.exports = {
    async create(req, res) {
        try {
            const { name, document, email, phone, document_url } = req.body;
            const accountId = req.user.accountId;
            const id = await Tenant.create({ accountId, name, document, email, phone, document_url });
            res.status(201).json({ id });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async update(req, res) {
        try {
            const { name, document, email, phone, document_url } = req.body;
            const { id } = req.params;
            const accountId = req.user.accountId;
            await Tenant.update(id, accountId, { name, document, email, phone, document_url });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async findAll(req, res) {
        try {
            const accountId = req.user.accountId;
            const tenants = await Tenant.findAll(accountId);
            res.json(tenants);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async findById(req, res) {
        try {
            const { id } = req.params;
            const accountId = req.user.accountId;
            const tenant = await Tenant.findById(id, accountId);
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
            res.json(tenant);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async delete(req, res) {
        try {
            const { id } = req.params;
            const accountId = req.user.accountId;
            const result = await Tenant.delete(id, accountId);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Tenant not found' });
            }
            res.json({ success: true, message: 'Tenant deleted' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
