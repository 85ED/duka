const User = require('../models/User');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
        const token = jwt.sign(
            { id: user.id, accountId: user.account_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`[LOGIN] Token gerado para user_id: ${user.id}, accountId: ${user.account_id}`);
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                role: user.role,
                accountId: user.account_id
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
