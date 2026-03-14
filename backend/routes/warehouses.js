const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');

router.use(protect);

router.get('/', getWarehouses);
router.get('/:id', getWarehouse);
router.post('/', authorize('admin'), createWarehouse);
router.put('/:id', authorize('admin'), updateWarehouse);
router.delete('/:id', authorize('admin'), deleteWarehouse);

module.exports = router;
