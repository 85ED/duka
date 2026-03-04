const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
require('express-async-errors');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const path = require('path');
const app = express();
const routes = require('./routes/api');
const { generateMonthlyCharges } = require('../scripts/generate_charges');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

/* ========= CAMINHO BASE DO PROJETO ========= */
/* volta uma pasta (sai do /src) */
const ROOT = path.join(__dirname, '..');

/* ========= STATIC FILES ========= */
app.use('/assets', express.static(path.join(ROOT, 'public/assets')));
app.use('/site', express.static(path.join(ROOT, 'public/site')));
app.use(express.static(path.join(ROOT, 'public')));

/* ========= APP ROUTE (Must be AFTER static files, BEFORE /api) ========= */
app.get('/app', (req, res) => {
    res.sendFile(path.join(ROOT, 'public/app/index.html'));
});

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Root folder: ${ROOT}`);
});

/* ========= CRON JOBS ========= */
// Automatic monthly charge generation
// Runs at 00:05 on the 1st day of each month
console.log('⏰ Initializing cron jobs...');

cron.schedule('5 0 1 * *', async () => {
    console.log('\n🔔 CRON: Monthly charge generation triggered');
    const result = await generateMonthlyCharges();
    if (result.success) {
        console.log(`✅ CRON: Generated ${result.generated} charges with ${result.errors} errors\n`);
    } else {
        console.log(`❌ CRON: Failed - ${result.error}\n`);
    }
}, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
});

console.log('✅ Cron jobs initialized: Monthly charges at 00:05 on 1st of month (SP timezone)');