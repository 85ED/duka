const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Helper to split SQL statements not just by semicolon but carefully?
// Actually for this schema simple splitting is enough as we don't have stored procs with bodies containing semicolons.
function splitSqlStatements(sql) {
    return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}

async function initDb() {
    let connection;
    try {
        console.log('Connecting to database server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT
        });

        console.log(`Creating database ${process.env.DB_NAME} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);

        console.log('Reading schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        const statements = splitSqlStatements(schema);

        for (const statement of statements) {
            await connection.query(statement);
        }

        console.log('Database initialized successfully.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

initDb();
