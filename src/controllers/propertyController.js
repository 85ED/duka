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

exports.getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.propertyId, req.user.accountId);
        if (!property) return res.status(404).json({ error: 'Not found' });
        res.json(property);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { address, description } = req.body;
        if (!address) return res.status(400).json({ error: 'address is required' });
        const rows = await Property.update(req.params.propertyId, req.user.accountId, { address, description });
        if (!rows) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Property updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Tenant Controller
exports.createTenant = async (req, res) => {
    try {
        const { name, document, email, phone, document_url } = req.body;
        const id = await Tenant.create({
            accountId: req.user.accountId,
            name,
            document,
            email,
            phone,
            document_url
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
