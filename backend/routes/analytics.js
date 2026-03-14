const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getActivityLogs,
  exportAnalyticsData,
} = require('../controllers/analyticsController');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/activity-logs', getActivityLogs);
router.get('/export', exportAnalyticsData);

module.exports = router;
