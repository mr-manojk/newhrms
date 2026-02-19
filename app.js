require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- PATH CONFIGURATION ---
// Explicitly resolve the path to the frontend build directory
const distPath = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log(`[System] MyHR Server Booting...`);
console.log(`[System] Root Dir: ${path.resolve(__dirname, '..')}`);
console.log(`[System] Dist Dir: ${distPath}`);

// Request Logging
app.use((req, res, next) => {
  if (!req.url.startsWith('/uploads')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets for Uploads
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// 1. Mount API Routes
app.use('/api', apiRoutes);

// 2. Explicit 404 for API
app.use('/api', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `API endpoint not found: ${req.method} ${req.url}` 
  });
});

// 3. Serve Frontend Build
if (fs.existsSync(distPath)) {
  console.log(`[System] ✅ Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
} else {
  console.warn(`[System] ⚠️ Frontend build folder NOT found at ${distPath}. Static serving disabled.`);
}

/**
 * Handle SPA routing
 * Using a regex string for the catch-all to prevent PathError in some path-to-regexp versions.
 * This ensures that any GET request not handled by previous routes serves index.html.
 */
app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #e11d48;">Build Missing</h1>
        <p>The server is running, but the <code>dist</code> folder was not found.</p>
        <p>Ensure your build command is <code>npm run deploy-build</code> and it completes successfully.</p>
      </div>
    `);
  }
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;