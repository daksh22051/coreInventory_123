const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');

router.use(protect);

router.get('/', getWarehouses);
router.get('/:id', getWarehouse);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

module.exports = router;
