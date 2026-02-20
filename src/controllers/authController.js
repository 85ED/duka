const User = require('../models/User');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');

// Apenas login agora - Platform Admin cria novos clientes
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log(`[LOGIN] Tentativa: ${email}`);
        const user = await User.findByEmail(email);
        if (!user) {
            console.log(`[LOGIN] Usuário não encontrado: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log(`[LOGIN] Usuário encontrado: ${email}, ID: ${user.id}`);
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            console.log(`[LOGIN] Senha inválida para: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log(`[LOGIN] Autenticação bem-sucedida para: ${email}`);
        
        // Se for parceiro, usar o account_id do usuário principal para garantir acesso aos dados
        let effectiveAccountId = user.account_id;
        if (user.primary_user_id) {
            const [primaryRows] = await db.execute(
                'SELECT account_id FROM users WHERE id = ? AND deleted_at IS NULL',
                [user.primary_user_id]
            );
            if (primaryRows.length > 0) {
                effectiveAccountId = primaryRows[0].account_id;
                console.log(`[LOGIN] Parceiro detectado. Usando account_id do primary user: ${effectiveAccountId}`);
            }
        }
        
        const token = jwt.sign(
            { id: user.id, accountId: effectiveAccountId, role: user.role, primaryUserId: user.primary_user_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`[LOGIN] Token gerado para user_id: ${user.id}, accountId: ${effectiveAccountId}`);
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                role: user.role,
                accountId: effectiveAccountId
            } 
        });
    } catch (error) {
        console.error(`[LOGIN ERROR]`, error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
};

// Verificar se usuário está autenticado
exports.verifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id, req.user.accountId);
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
};
