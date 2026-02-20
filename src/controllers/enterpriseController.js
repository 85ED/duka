const Enterprise = require('../models/Enterprise');

// Criar empreendimento
exports.createEnterprise = async (req, res) => {
    try {
        const { name, address, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Nome do empreendimento é obrigatório' });
        }

        const id = await Enterprise.create({
            accountId: req.user.accountId,
            name,
            address,
            description
        });

        res.status(201).json({ 
            id, 
            message: 'Empreendimento criado com sucesso' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar empreendimento' });
    }
};

// Listar empreendimentos
exports.listEnterprises = async (req, res) => {
    try {
        const enterprises = await Enterprise.findAll(req.user.accountId);
        res.json(enterprises);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar empreendimentos' });
    }
};

// Obter um empreendimento com unidades
exports.getEnterprise = async (req, res) => {
    try {
        const { id } = req.params;
        const enterprise = await Enterprise.getWithUnits(id, req.user.accountId);
        
        if (!enterprise) {
            return res.status(404).json({ error: 'Empreendimento não encontrado' });
        }

        res.json(enterprise);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao obter empreendimento' });
    }
};

// Atualizar empreendimento
exports.updateEnterprise = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome do empreendimento é obrigatório' });
        }

        const updated = await Enterprise.update(id, req.user.accountId, {
            name,
            address,
            description
        });

        if (!updated) {
            return res.status(404).json({ error: 'Empreendimento não encontrado' });
        }

        res.json({ message: 'Empreendimento atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar empreendimento' });
    }
};

// Deletar empreendimento
exports.deleteEnterprise = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se tem unidades ativas
        const enterprise = await Enterprise.getWithUnits(id, req.user.accountId);
        if (!enterprise) {
            return res.status(404).json({ error: 'Empreendimento não encontrado' });
        }

        if (enterprise.units && enterprise.units.length > 0) {
            return res.status(400).json({ 
                error: 'Não é possível excluir empreendimento com unidades cadastradas' 
            });
        }

        const deleted = await Enterprise.delete(id, req.user.accountId);

        if (!deleted) {
            return res.status(404).json({ error: 'Empreendimento não encontrado' });
        }

        res.json({ message: 'Empreendimento excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir empreendimento' });
    }
};
