const ContractService = require('../models/ContractService');

exports.listContractServices = async (req, res) => {
    try {
        const { contractId } = req.params;
        const services = await ContractService.listByContract(contractId, req.user.accountId);
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar servicos do contrato' });
    }
};

exports.addContractService = async (req, res) => {
    try {
        const { contractId } = req.params;
        const { serviceId, price, startDate } = req.body;
        if (!serviceId) {
            return res.status(400).json({ error: 'Servico obrigatorio' });
        }
        const effectiveDate = startDate || new Date().toISOString().slice(0, 10);
        const id = await ContractService.add({
            contractId,
            serviceId,
            price: price !== undefined ? price : null,
            startDate: effectiveDate
        });
        res.status(201).json({ id, message: 'Servico adicionado ao contrato' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao adicionar servico' });
    }
};

exports.deactivateContractService = async (req, res) => {
    try {
        const { contractServiceId } = req.params;
        await ContractService.deactivate({
            id: contractServiceId,
            accountId: req.user.accountId
        });
        res.json({ message: 'Servico cancelado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar servico' });
    }
};
