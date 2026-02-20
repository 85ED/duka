const Property = require('../models/Property');
const Tenant = require('../models/Tenant');

// Property Controller
exports.createProperty = async (req, res) => {
    try {
        const { address, description } = req.body;
        const id = await Property.create({
            accountId: req.user.accountId,
            address,
            description
        });
        res.status(201).json({ id, message: 'Property created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.listProperties = async (req, res) => {
    try {
        const properties = await Property.findAll(req.user.accountId);
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Tenant Controller
exports.createTenant = async (req, res) => {
    try {
        const { name, document, email, phone } = req.body;
        const id = await Tenant.create({
            accountId: req.user.accountId,
            name,
            document,
            email,
            phone
        });
        res.status(201).json({ id, message: 'Tenant created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.listTenants = async (req, res) => {
    try {
        const tenants = await Tenant.findAll(req.user.accountId);
        res.json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
