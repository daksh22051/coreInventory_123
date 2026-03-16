const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  exportInventory,
  exportReceipts,
  exportDeliveries,
  exportStockReport,
  exportActivityLogs
} = require('../controllers/exportController');

router.use(protect);

router.get('/inventory', exportInventory);
router.get('/receipts', exportReceipts);
router.get('/deliveries', exportDeliveries);
router.get('/stock-report', exportStockReport);
router.get('/activity-logs', authorize('admin', 'inventory_manager'), exportActivityLogs);

module.exports = router;
