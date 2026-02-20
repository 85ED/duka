const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('express-async-errors');
require('dotenv').config();

const app = express();
const routes = require('./routes/api');

app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());

// Frontend estático
app.use(express.static('public'));

app.use('/api', routes);

// Rota principal
app.get('/', (req, res) => {
    res.json({ message: 'Bem-vindo ao Đuka API!' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Đuka Server running on port ${PORT}`);
});
