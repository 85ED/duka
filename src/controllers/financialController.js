const Charge = require('../models/Charge');
const Payment = require('../models/Payment');
const Dashboard = require('../models/Dashboard');
const Expense = require('../models/Expense');
const PartnerShare = require('../models/PartnerShare');

exports.createCharge = async (req, res) => {
    try {
        const { contractId, referenceMonth, dueDate } = req.body;
        const id = await Charge.create({
            accountId: req.user.accountId,
            contractId,
            referenceMonth,
            dueDate
        });
        res.status(201).json({ id, message: 'Charge generated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addChargeItem = async (req, res) => {
    try {
        const { chargeId } = req.params;
        const { description, amount, type } = req.body;

        await Charge.addItem(chargeId, req.user.accountId, {
            description,
            amount,
            type
        });

        res.json({ message: 'Item added' });
    } catch (error) {
        console.error(error);
        if (error.message.includes('non-pending')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

exports.registerPayment = async (req, res) => {
    try {
        const { chargeId, amountPaid, paymentDate, paymentMethod } = req.body;

        const result = await Payment.register({
            accountId: req.user.accountId,
            chargeId,
            userId: req.user.id,
            amountPaid,
            paymentDate,
            paymentMethod
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        if (error.message.includes('exceeds charge total')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Baixa rápida - 1 clique
exports.quickPayment = async (req, res) => {
    try {
        const { chargeId } = req.params;

        const result = await Payment.quickPay({
            accountId: req.user.accountId,
            chargeId: parseInt(chargeId),
            userId: req.user.id
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

exports.getCharge = async (req, res) => {
    try {
        const { id } = req.params;
        const charge = await Charge.findById(id, req.user.accountId);
        if (!charge) return res.status(404).json({ error: 'Charge not found' });
        res.json(charge);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.listCharges = async (req, res) => {
    try {
        const { status, month } = req.query;
        const charges = await Charge.findAll(req.user.accountId, { status, month });
        res.json(charges);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.voidCharge = async (req, res) => {
    try {
        const { id } = req.params;
        await Charge.voidById(parseInt(id), req.user.accountId);
        res.json({ message: 'Charge voided' });
    } catch (error) {
        console.error(error);
        if (error.message.includes('paid')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Enhanced dashboard with expenses and partner distribution
exports.getDashboardSummary = async (req, res) => {
    try {
        const { year, month } = req.query;
        const stats = await Dashboard.getSummary(req.user.accountId, { year, month });
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
