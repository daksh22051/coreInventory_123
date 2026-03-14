const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAdjustments, createAdjustment, applyAdjustment } = require('../controllers/adjustmentController');

router.use(protect);

router.get('/', getAdjustments);
router.post('/', createAdjustment);
router.put('/:id/apply', authorize('admin'), applyAdjustment);

module.exports = router;
