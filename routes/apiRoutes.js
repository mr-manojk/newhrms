// @ts-nocheck
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
    const targetCategory = category || '';
    const userDir = username ? username.toLowerCase().replace(/\s+/g, '_') : 'common';
    const finalDir = path.join(__dirname, '../uploads', userDir, targetCategory);
    
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
router.post('/users/forgot-password', hrController.forgotPassword);
router.post('/users/reset-password', hrController.resetPassword);

// Attendance Routes
router.get('/attendance', hrController.getAttendance);
router.post('/attendance/bulk', hrController.bulkUpsertAttendance);

// Roster Routes
router.get('/rosters', hrController.getRosters);
router.post('/rosters/bulk', hrController.bulkUpsertRosters);

// Leave Routes
router.get('/leaves', hrController.getLeaves);
router.post('/leaves/bulk', hrController.bulkUpsertLeaves);
router.get('/leave-balances', hrController.getLeaveBalances);
router.post('/leave-balances/bulk', hrController.bulkUpsertBalances);

// Payroll Routes
router.get('/payroll/salary-structures', hrController.getSalaryStructures);
router.post('/payroll/salary-structures/bulk', hrController.bulkUpsertSalaryStructures);
router.get('/payroll/expenses', hrController.getExpenses);
router.post('/payroll/expenses/bulk', hrController.bulkUpsertExpenses);
router.get('/payroll/bonuses', hrController.getBonusIncrements);
router.post('/payroll/bonuses/bulk', hrController.bulkUpsertBonusIncrements);
router.get('/payroll/runs', hrController.getPayrollRuns);
router.post('/payroll/runs/bulk', hrController.bulkUpsertPayrollRuns);

// System Routes
router.get('/holidays', hrController.getHolidays);
router.post('/holidays/bulk', hrController.bulkUpsertHolidays);
router.get('/config', hrController.getConfig);
router.post('/config', hrController.saveConfig);
router.get('/notifications', hrController.getNotifications);
router.post('/notifications/bulk', hrController.bulkUpsertNotifications);

// Performance Routes
router.get('/performance/goals', hrController.getPerformanceGoals);
router.post('/performance/goals/bulk', hrController.bulkUpsertPerformanceGoals);
router.get('/performance/reviews', hrController.getPerformanceReviews);
router.post('/performance/reviews/bulk', hrController.bulkUpsertPerformanceReviews);
router.get('/performance/feedback', hrController.getPerformanceFeedback);
router.post('/performance/feedback/bulk', hrController.bulkUpsertPerformanceFeedback);

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
