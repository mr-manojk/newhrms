// @ts-nocheck
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT

const server = app.listen(PORT, () => {
  console.log(`🚀 MyHR Backend: Operational on port ${PORT}`);
  console.log(`📡 API Base:  https://node-mysql-api-lhbg.onrender.com/api`); //Local server path for production use correct one.
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('🔌 Server closed.');
    process.exit(0);
  });
});
