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

console.log(`[System] Initializing NexusHR Server...`);
console.log(`[System] Checking for frontend build at: ${distPath}`);

if (fs.existsSync(distPath)) {
  console.log(`[System] ✅ Frontend build folder detected.`);
  if (fs.existsSync(indexPath)) {
    console.log(`[System] ✅ index.html detected.`);
  } else {
    console.error(`[System] ❌ dist folder exists but index.html is missing. Ensure 'npm run build' completed.`);
  }
} else {
  console.warn(`[System] ⚠️ Frontend build folder NOT found. Static serving will be disabled.`);
}

// Request Logging Middleware
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. Mount API Routes
app.use('/api', apiRoutes);

// 2. Explicit 404 Handler for /api (Ensures no /api request falls through to SPA routing)
app.use('/api', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `API Endpoint not found: ${req.method} ${req.originalUrl}`,
    hint: "Check if the route is defined in server/routes/apiRoutes.js"
  });
});

// --- PRODUCTION BUILD SERVING ---
// Serve static files from the Vite build directory
app.use(express.static(distPath));

/**
 * Handle Single Page Application (SPA) routing
 * This middleware catches any GET request that isn't for an API or an upload
 * and serves the index.html from the frontend build.
 */
app.get('*', (req, res, next) => {
  // Only intercept GET requests that aren't API calls
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[Server] Error sending index.html: ${err.message}`);
      res.status(404).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #e11d48;">NexusHR Frontend Not Found</h1>
            <p>The server is running, but the frontend build is missing.</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block; text-align: left; margin-top: 20px;">
              <strong>Troubleshooting for Render:</strong>
              <ul>
                <li>Ensure <strong>Build Command</strong> is set to <code>npm run deploy-build</code></li>
                <li>Ensure <strong>Start Command</strong> is set to <code>npm start</code></li>
                <li>Verify that the <code>dist</code> folder is being generated correctly during build.</li>
              </ul>
            </div>
          </body>
        </html>
      `);
    }
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;