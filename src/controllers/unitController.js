const Unit = require('../models/Unit');
const Enterprise = require('../models/Enterprise');

// Criar unidade
exports.createUnit = async (req, res) => {
    try {
        const { enterpriseId, identifier, description, areaSqm } = req.body;
        
        if (!enterpriseId || !identifier) {
            return res.status(400).json({ 
                error: 'Empreendimento e identificador são obrigatórios' 
            });
        }

        // Verificar se empreendimento existe
        const enterprise = await Enterprise.findById(enterpriseId, req.user.accountId);
        if (!enterprise) {
            return res.status(404).json({ error: 'Empreendimento não encontrado' });
        }

        const id = await Unit.create({
            accountId: req.user.accountId,
            enterpriseId,
            identifier,
            description,
            areaSqm
        });

        res.status(201).json({ 
            id, 
            message: 'Unidade criada com sucesso' 
        });
    } catch (error) {
        // Verificar erro de duplicidade
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'Já existe uma unidade com este identificador neste empreendimento' 
            });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar unidade' });
    }
};

// Listar todas unidades
exports.listUnits = async (req, res) => {
    try {
        const { enterpriseId } = req.query;
        
        let units;
        if (enterpriseId) {
            units = await Unit.findByEnterprise(enterpriseId, req.user.accountId);
        } else {
            units = await Unit.findAll(req.user.accountId);
        }
        
        res.json(units);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar unidades' });
    }
};

// Obter uma unidade
exports.getUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const unit = await Unit.findById(id, req.user.accountId);
        
        if (!unit) {
            return res.status(404).json({ error: 'Unidade não encontrada' });
        }

        res.json(unit);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao obter unidade' });
    }
};

// Atualizar unidade
exports.updateUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const { identifier, description, areaSqm } = req.body;

        if (!identifier) {
            return res.status(400).json({ error: 'Identificador é obrigatório' });
        }

        const updated = await Unit.update(id, req.user.accountId, {
            identifier,
            description,
            areaSqm
        });

        if (!updated) {
            return res.status(404).json({ error: 'Unidade não encontrada' });
        }

        res.json({ message: 'Unidade atualizada com sucesso' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'Já existe uma unidade com este identificador neste empreendimento' 
            });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar unidade' });
    }
};

// Deletar unidade
exports.deleteUnit = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se tem contrato ativo
        const unit = await Unit.findById(id, req.user.accountId);
        if (!unit) {
            return res.status(404).json({ error: 'Unidade não encontrada' });
        }

        if (unit.contract_id) {
            return res.status(400).json({ 
                error: 'Não é possível excluir unidade com contrato ativo' 
            });
        }

        const deleted = await Unit.delete(id, req.user.accountId);

        if (!deleted) {
            return res.status(404).json({ error: 'Unidade não encontrada' });
        }

        res.json({ message: 'Unidade excluída com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir unidade' });
    }
};

// Estatísticas de unidades (para dashboard)
exports.getUnitStats = async (req, res) => {
    try {
        const stats = await Unit.getStats(req.user.accountId);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
};
