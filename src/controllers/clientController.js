const Account = require('../models/Account');
const User = require('../models/User');

// Platform Admin: listar todos os clientes
exports.listClients = async (req, res) => {
    try {
        // Apenas platform_admin pode listar clients
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Buscar accounts do tipo 'client'
        const [clients] = await require('../config/database').query(
            `SELECT a.id, a.name, a.created_at, 
                    COUNT(DISTINCT u.id) as users_count,
                    COUNT(DISTINCT p.id) as properties_count
             FROM accounts a
             LEFT JOIN users u ON a.id = u.account_id AND u.deleted_at IS NULL
             LEFT JOIN properties p ON a.id = p.account_id AND p.deleted_at IS NULL
             WHERE a.type = 'client' AND a.deleted_at IS NULL
             GROUP BY a.id
             ORDER BY a.created_at DESC`
        );

        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar clientes' });
    }
};

// Platform Admin: criar novo cliente
exports.createClient = async (req, res) => {
    try {
        // Apenas platform_admin pode criar clients
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { clientName, adminName, adminEmail, adminPassword } = req.body;

        // Validar campos obrigatórios
        if (!clientName || !adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        if (adminPassword.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se email já existe
        const existingUser = await User.findByEmail(adminEmail);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // 1. Criar Account do tipo 'client'
        const db = require('../config/database');
        const [accountResult] = await db.execute(
            'INSERT INTO accounts (name, type) VALUES (?, ?)',
            [clientName, 'client']
        );
        const accountId = accountResult.insertId;

        // 2. Criar User admin para esse client
        const userId = await User.create({
            accountId,
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'client_admin'
        });

        res.status(201).json({
            message: 'Cliente criado com sucesso',
            account: {
                id: accountId,
                name: clientName,
                adminEmail,
                adminName
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
};

// Platform Admin: obter detalhes do cliente
exports.getClient = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { clientId } = req.params;

        const [client] = await require('../config/database').query(
            `SELECT a.*, 
                    COUNT(DISTINCT u.id) as users_count,
                    COUNT(DISTINCT e.id) as enterprises_count,
                    COUNT(DISTINCT un.id) as units_count,
                    COUNT(DISTINCT c.id) as contracts_count,
                    COALESCE(SUM(ch.total), 0) as total_revenue
             FROM accounts a
             LEFT JOIN users u ON a.id = u.account_id AND u.deleted_at IS NULL
             LEFT JOIN enterprises e ON a.id = e.account_id AND e.deleted_at IS NULL
             LEFT JOIN units un ON a.id = un.account_id AND un.deleted_at IS NULL
             LEFT JOIN contracts c ON a.id = c.account_id AND c.status = 'active'
             LEFT JOIN (
                SELECT account_id, SUM(total_amount) as total
                FROM charges WHERE status = 'paid'
                GROUP BY account_id
             ) ch ON a.id = ch.account_id
             WHERE a.id = ? AND a.type = 'client' AND a.deleted_at IS NULL
             GROUP BY a.id`,
            [clientId]
        );

        if (!client || client.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        res.json(client[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao obter cliente' });
    }
};

// Platform Admin: atualizar cliente
exports.updateClient = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { clientId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const db = require('../config/database');
        
        const [result] = await db.execute(
            'UPDATE accounts SET name = ? WHERE id = ? AND type = ? AND deleted_at IS NULL',
            [name, clientId, 'client']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        res.json({ message: 'Cliente atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
};

// Platform Admin: deletar cliente (soft delete)
exports.deleteClient = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { clientId } = req.params;
        const db = require('../config/database');

        // Soft delete account
        await db.execute(
            'UPDATE accounts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
            [clientId]
        );

        // Soft delete todos os users desse account
        await db.execute(
            'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE account_id = ?',
            [clientId]
        );

        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
};

// Platform Admin: listar usuários de um cliente
exports.listClientUsers = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { clientId } = req.params;
        const db = require('../config/database');

        const [users] = await db.query(
            `SELECT id, name, email, role, created_at 
             FROM users 
             WHERE account_id = ? AND deleted_at IS NULL
             ORDER BY role ASC, name ASC`,
            [clientId]
        );

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
};

// Platform Admin: criar usuário para um cliente
exports.createClientUser = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { clientId } = req.params;
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se email já existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Verificar se o cliente existe
        const db = require('../config/database');
        const [accounts] = await db.query(
            'SELECT id FROM accounts WHERE id = ? AND type = ? AND deleted_at IS NULL',
            [clientId, 'client']
        );

        if (accounts.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Criar usuário
        const userId = await User.create({
            accountId: parseInt(clientId),
            name,
            email,
            password,
            role: role || 'client_member'
        });

        res.status(201).json({ 
            id: userId, 
            message: 'Usuário criado com sucesso' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

// Platform Admin: resetar senha de usuário
exports.resetUserPassword = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        const db = require('../config/database');

        const [result] = await db.execute(
            'UPDATE users SET password = ? WHERE id = ? AND deleted_at IS NULL',
            [newPassword, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
};

// Platform Admin: atualizar dados de usuário (nome/email)
exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { userId } = req.params;
        const { name, email } = req.body;

        if (!name && !email) {
            return res.status(400).json({ error: 'Informe nome ou email para atualizar' });
        }

        const db = require('../config/database');

        // Verificar se email já existe (se estiver atualizando email)
        if (email) {
            const [existing] = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
                [email, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email já está em uso por outro usuário' });
            }
        }

        // Construir query dinamicamente
        const updates = [];
        const values = [];
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        values.push(userId);

        const [result] = await db.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
};
