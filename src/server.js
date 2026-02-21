const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('express-async-errors');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const path = require('path');
const app = express();
const routes = require('./routes/api');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

/* ========= CAMINHO BASE DO PROJETO ========= */
/* volta uma pasta (sai do /src) */
const ROOT = path.join(__dirname, '..');

/* ========= STATIC FILES ========= */
app.use('/assets', express.static(path.join(ROOT, 'public/assets')));
app.use('/site', express.static(path.join(ROOT, 'public/site')));
app.use('/app', express.static(path.join(ROOT, 'public/app')));
app.use(express.static(path.join(ROOT, 'public')));

/* ========= ROTAS ========= */
app.get('/login', (req, res) => {
    res.sendFile(path.join(ROOT, 'public/app/login.html'));
});

app.use('/api', routes);

app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT, 'public/site/index.html'));
});

/* ========= ERROS ========= */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Root folder: ${ROOT}`);
});