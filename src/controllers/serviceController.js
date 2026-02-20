const Service = require('../models/Service');

exports.listServices = async (req, res) => {
    try {
        const services = await Service.list(req.user.accountId);
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar servicos' });
    }
};

exports.createService = async (req, res) => {
    try {
        const { name, icon, defaultPrice } = req.body;
        if (!name || defaultPrice === undefined) {
            return res.status(400).json({ error: 'Nome e valor sao obrigatorios' });
        }
        const id = await Service.create({
            accountId: req.user.accountId,
            name,
            icon,
            defaultPrice
        });
        res.status(201).json({ id, message: 'Servico criado com sucesso' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Servico ja existe' });
        }
        res.status(500).json({ error: 'Erro ao criar servico' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, defaultPrice, status } = req.body;
        await Service.update({
            accountId: req.user.accountId,
            id,
            name,
            icon,
            defaultPrice,
            status
        });
        res.json({ message: 'Servico atualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar servico' });
    }
};
