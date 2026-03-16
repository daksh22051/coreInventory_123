const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  configureIntegration,
  createCustomIntegration,
} = require('../controllers/integrationController');

router.use(protect);

router.get('/', getIntegrations);
router.post('/custom', createCustomIntegration);
router.post('/:id/connect', connectIntegration);
router.post('/:id/disconnect', disconnectIntegration);
router.post('/:id/configure', configureIntegration);

module.exports = router;
