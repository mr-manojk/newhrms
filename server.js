// @ts-nocheck			  
require('dotenv').config();
const express = require('express');
const app = require('./app');
const path = require('path'); //Remove when live

const PORT = process.env.PORT
				  

const server = app.listen(PORT, async () => {
  console.log(`🚀 MyHR Backend: Operational on port ${PORT}`);
  console.log(`📡 API Base:  https://node-mysql-api-lhbg.onrender.com/api`); //Local server path for production use correct one.

//Remove when live  
// Self-healing: Ensure loginNotes column exists in attendance table
    try {
      const pool = require('./config/db');
      const [columns] = await pool.query('SHOW COLUMNS FROM attendance LIKE "loginNotes"');
      if (columns.length === 0) {
        console.log('🛠️ Adding loginNotes column to attendance table...');
        await pool.query('ALTER TABLE attendance ADD COLUMN loginNotes TEXT');
        console.log('✅ loginNotes column added successfully.');
      }
    } catch (err) {
      console.error('⚠️ Migration check failed:', err.message);
    }
  });

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('🔌 Server closed.');
    process.exit(0);
  });
});
