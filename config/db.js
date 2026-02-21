// @ts-nocheck
require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Database connection pool configuration.
 * Supports standard cloud environment variables.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 3,
  connectTimeout: 10000,
  idleTimeout: 30000, 
  queueLimit: 0,
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // SSL is often required by cloud providers (e.g., Aiven, Azure, AWS)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  console.error('🔥 MySQL Pool Error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Connection to database was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections. Limit is strictly set to 3.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

console.log(`📦 Database: Connection pool established (Limit: 3).`);
if (process.env.DB_SSL === 'true') {
  console.log('🔒 SSL Encryption enabled for DB connection.');
}

module.exports = pool;
