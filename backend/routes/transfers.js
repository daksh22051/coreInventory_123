const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTransfers, createTransfer, completeTransfer } = require('../controllers/transferController');

router.use(protect);

router.get('/', getTransfers);
router.post('/', createTransfer);
router.put('/:id/complete', completeTransfer);

module.exports = router;
