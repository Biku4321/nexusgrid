const { Pool } = require('pg');
const logger = require('../logger');

const pool = new Pool({
  host:     process.env.POSTGRES_HOST     || 'postgres',
  port:     parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB       || 'nexusgrid',
  user:     process.env.POSTGRES_USER     || 'nexus',
  password: process.env.POSTGRES_PASSWORD || 'supersecretpassword',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

async function connectDB() {
  const client = await pool.connect();
  logger.info('PostgreSQL connected');
  client.release();
}

module.exports = { pool, connectDB };