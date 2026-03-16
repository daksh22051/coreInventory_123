const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getAcknowledgements,
  acknowledgeAlert,
} = require('../controllers/alertController');

router.use(protect);

router.get('/rules', getRules);
router.post('/rules', createRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);
router.get('/acks', getAcknowledgements);
router.post('/acks', acknowledgeAlert);

module.exports = router;
