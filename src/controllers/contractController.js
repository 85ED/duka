const Contract = require('../models/Contract');
const ContractHistory = require('../models/ContractHistory');

exports.createContract = async (req, res) => {
    try {
        const { unitId, propertyId, tenantId, startDate, endDate, rentAmount, contractAddress, contractUrl } = req.body;

        // Requer unitId ou propertyId
        if (!unitId && !propertyId) {
            return res.status(400).json({ error: 'unitId ou propertyId é obrigatório' });
        }

        if (!tenantId || !startDate || !rentAmount) {
            return res.status(400).json({ error: 'inquilino, data início e valor são obrigatórios' });
        }

        const id = await Contract.create({
            accountId: req.user.accountId,
            unitId,
            propertyId,
            tenantId,
            startDate,
            endDate,
            rentAmount,
            contractAddress,
            contractUrl
        });

        res.status(201).json({ id, message: 'Contrato criado com sucesso' });
    } catch (error) {
        console.error(error);
        if (error.message.includes('already has an active contract')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Erro ao criar contrato' });
    }
};

exports.listContracts = async (req, res) => {
    try {
        const contracts = await Contract.findAll(req.user.accountId);
        res.json(contracts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar contratos' });
    }
};

exports.getContract = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.findById(id, req.user.accountId);

        if (!contract) {
            return res.status(404).json({ error: 'Contrato não encontrado' });
        }

        res.json(contract);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar contrato' });
    }
};

// Replace a tenant/contract with a new one
exports.replaceContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const { propertyId, tenantId, startDate, endDate, rentAmount, reason, contractAddress, contractUrl } = req.body;

        const newContractId = await Contract.replace(contractId, {
            accountId: req.user.accountId,
            propertyId,
            tenantId,
            startDate,
            endDate,
            rentAmount,
            reason,
            contractAddress,
            contractUrl
        });

        res.status(201).json({ 
            message: 'Contract replaced successfully',
            oldContractId: contractId,
            newContractId
        });
    } catch (error) {
        console.error(error);
        if (error.message === 'Contract not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Apply rent adjustment
exports.applyAdjustment = async (req, res) => {
    try {
        const { contractId } = req.params;
        const { percentage } = req.body;

        if (percentage === undefined) {
            return res.status(400).json({ error: 'Percentage required' });
        }

        const result = await Contract.applyAdjustment(contractId, req.user.accountId, percentage);

        res.json({
            message: 'Rent adjustment applied',
            oldAmount: result.oldAmount,
            newAmount: result.newAmount,
            percentage: result.percentage
        });
    } catch (error) {
        console.error(error);
        if (error.message === 'Contract not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Get contract history for property
exports.getPropertyHistory = async (req, res) => {
    try {
        const { propertyId } = req.params;

        const history = await ContractHistory.findByProperty(propertyId, req.user.accountId);

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// List all contract replacements
exports.listContractHistory = async (req, res) => {
    try {
        const history = await ContractHistory.findAll(req.user.accountId);
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

