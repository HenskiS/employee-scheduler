require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'scheduling_app_dev',
  user: 'postgres',
  password: process.env.DB_PASSWORD
});

client.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL!');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('Database version:', result.rows[0].version);
    client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
  });