const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDeliveries,
  createDelivery,
  updateDeliveryStatus,
  getDeliveryStats,
  getDeliveryOrdersLegacy,
  createDeliveryOrderLegacy,
  updateDeliveryOrderLegacy,
} = require('../controllers/deliveryController');

// Public legacy delivery-orders routes
router.get('/', getDeliveryOrdersLegacy);
router.post('/', createDeliveryOrderLegacy);
router.put('/legacy/:id/status', updateDeliveryOrderLegacy);

// Authenticated deliveries routes
router.use(protect);
router.get('/stats', getDeliveryStats);
router.post('/create', createDelivery);
router.put('/:id/status', updateDeliveryStatus);

module.exports = router;
