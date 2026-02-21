// @ts-nocheck
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', apiRoutes);

/**
 * Explicit 404 Handler for API
 * We use a prefix-based app.use here instead of a wildcard path string.
 * This ensures any /api request not caught by apiRoutes returns a JSON 404.
 */
app.use('/api', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `API Endpoint not found: ${req.method} ${req.originalUrl}`,
    hint: "Check if the route is defined in server/routes/apiRoutes.js"
  });
});

// --- PRODUCTION BUILD SERVING ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

/**
 * Handle Single Page Application (SPA) routing
 * Instead of app.get('*') or app.get('/*'), which trigger PathErrors in Node 22,
 * we use a standard middleware function without a path string.
 * This acts as a catch-all for all requests that reached this point.
 */
app.use((req, res, next) => {
  // 1. Only handle GET requests for the frontend
  // 2. Ensure we don't accidentally handle /api or /uploads if they slipped through
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        // If the file doesn't exist (e.g. build hasn't run), move to the next handler/error
        res.status(404).send("Frontend build not found. If you are in development, ensure Vite is running. If in production, ensure 'npm run build' was executed.");
      }
    });
  }
  // Otherwise, continue (this will eventually hit the global error handler or a 404)
  next();
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
