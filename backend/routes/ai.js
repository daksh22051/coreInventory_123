const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getReorderSuggestions,
  getSlowMovers,
  getShortagePredictions,
  getInsights
} = require('../controllers/aiController');

router.use(protect);

router.get('/reorder-suggestions', getReorderSuggestions);
router.get('/slow-movers', getSlowMovers);
router.get('/shortage-predictions', getShortagePredictions);
router.get('/insights', getInsights);

module.exports = router;
