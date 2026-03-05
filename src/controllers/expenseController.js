const Expense = require('../models/Expense');
const Property = require('../models/Property');

exports.createExpense = async (req, res) => {
    try {
        const { propertyId, description, amount, expenseDate, category } = req.body;

        // Verify property exists only if propertyId is provided
        if (propertyId) {
            const property = await Property.findById(propertyId, req.user.accountId);
            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }
        }

        const id = await Expense.create({
            accountId: req.user.accountId,
            propertyId: propertyId || null,
            description,
            amount: parseFloat(amount),
            paidByUserId: req.user.id,
            expenseDate,
            category
        });

        res.status(201).json({ id, message: 'Expense created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.listExpenses = async (req, res) => {
    try {
        const { propertyId, status, month } = req.query;

        const expenses = await Expense.findAll(req.user.accountId, {
            propertyId: propertyId ? parseInt(propertyId) : undefined,
            status,
            month
        });

        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findById(id, req.user.accountId);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(expense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateExpenseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const expense = await Expense.findById(id, req.user.accountId);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        await Expense.updateStatus(id, req.user.accountId, status);

        res.json({ message: 'Expense status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPropertyExpenses = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { month } = req.query;

        // Verify property exists
        const property = await Property.findById(propertyId, req.user.accountId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const total = await Expense.getPropertyExpenses(propertyId, req.user.accountId, month);

        res.json({ propertyId, total, month: month || 'all' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
