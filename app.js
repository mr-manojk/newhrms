require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- PATH CONFIGURATION ---
// Resolved relative to this file's location in server/
const distPath = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log(`[System] MyHR Server Booting...`);
console.log(`[System] Serving frontend from: ${distPath}`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets for Uploads
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// 1. Mount API Routes
app.use('/api', apiRoutes);

// 2. Serve Frontend Build static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  console.warn(`[System] ⚠️ Frontend build folder NOT found. Static serving will be disabled.`);
}

/**
 * 3. Handle SPA routing
 * This serves index.html for any request that doesn't match an API route or static file.
 */
app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint not found' });
  }

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build missing. Please run "npm run build" first.');
  }
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;