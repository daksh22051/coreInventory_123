const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getActivityLogs,
  getEntityLogs,
  getInventoryTurnover,
  getTopProducts,
  getDeadStock,
  getStockMovement,
  getWarehousePerformance,
  getWarehouseHeatmap,
  getStockDistribution
} = require('../controllers/analyticsController');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/activity-logs', getActivityLogs);
router.get('/activity-logs/entity/:type/:id', getEntityLogs);
router.get('/turnover', getInventoryTurnover);
router.get('/top-products', getTopProducts);
router.get('/dead-stock', getDeadStock);
router.get('/stock-movement', getStockMovement);
router.get('/warehouse-performance', getWarehousePerformance);
router.get('/warehouse-heatmap', getWarehouseHeatmap);
router.get('/stock-distribution', getStockDistribution);

module.exports = router;
