const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats, getActivityLogs } = require('../controllers/analyticsController');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/activity-logs', getActivityLogs);

module.exports = router;
