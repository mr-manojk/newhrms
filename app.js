
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

// --- PRODUCTION BUILD SERVING ---
// Check if we are running in a production-like environment (e.g., Render, Heroku)
// and serve the frontend 'dist' folder if it exists.
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Handle Single Page Application (SPA) routing
// All GET requests that aren't API calls should serve the index.html
app.get('*', (req, res, next) => {
  // If the request is for an API or an upload, let it fall through to other handlers
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If index.html doesn't exist, the build hasn't been run or pointed correctly
      res.status(404).send("Frontend build not found. Please run 'npm run build' first.");
    }
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
