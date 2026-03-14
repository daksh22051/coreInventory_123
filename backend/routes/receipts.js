const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getReceipts, 
  getReceipt,
  createReceipt, 
  updateReceipt,
  confirmReceipt,
  markReady,
  validateReceipt, 
  cancelReceipt 
} = require('../controllers/receiptController');

router.use(protect);

router.get('/', getReceipts);
router.get('/:id', getReceipt);
router.post('/', createReceipt);
router.put('/:id', updateReceipt);
router.put('/:id/confirm', confirmReceipt);    // draft → waiting
router.put('/:id/ready', markReady);           // waiting → ready
router.put('/:id/validate', validateReceipt);  // ready → done (updates stock)
router.put('/:id/cancel', cancelReceipt);

module.exports = router;
