
const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { username, category } = req.body;
    const userDir = username ? username.toLowerCase().replace(/\s+/g, '_') : 'common';
    const finalDir = path.join(__dirname, '../uploads', userDir, category || '');
    
    fs.mkdirSync(finalDir, { recursive: true });
    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${baseName}_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

// Health Check
router.get('/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));

// User Routes
router.get('/users', hrController.getUsers);
router.post('/users/bulk', hrController.bulkUpsertUsers);

// Attendance Routes
router.get('/attendance', hrController.getAttendance);
router.post('/attendance/bulk', hrController.bulkUpsertAttendance);

// Leave Routes
router.get('/leaves', hrController.getLeaves);
router.post('/leaves/bulk', hrController.bulkUpsertLeaves);
router.get('/leave-balances', hrController.getLeaveBalances);
router.post('/leave-balances/bulk', hrController.bulkUpsertBalances);

// System Routes
router.get('/holidays', hrController.getHolidays);
router.post('/holidays/bulk', hrController.bulkUpsertHolidays);
router.get('/config', hrController.getConfig);
router.post('/config', hrController.saveConfig);
router.get('/notifications', hrController.getNotifications);
router.post('/notifications/bulk', hrController.bulkUpsertNotifications);

// Upload Route
/**
 * @param {Request} req
 * @param {Response} res
 */
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  
  // Construct the relative URL for the frontend
  const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
  const webUrl = '/' + relativePath.replace(/\\/g, '/');
  
  res.json({ success: true, url: webUrl });
});

module.exports = router;
