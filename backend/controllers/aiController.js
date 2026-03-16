const {
  getSmartReorderSuggestions,
  getSlowMovers,
  getShortagePredictions,
  getAIInsights
} = require('../services/stockPredictor');

const getReorderSuggestions = async (req, res) => {
  try {
    const suggestions = await getSmartReorderSuggestions();
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSlowMoversHandler = async (req, res) => {
  try {
    const { days = 60 } = req.query;
    const slowMovers = await getSlowMovers(Number(days));
    res.json({ success: true, data: slowMovers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getShortagePredictionsHandler = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const predictions = await getShortagePredictions(Number(days));
    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const insights = await getAIInsights();
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReorderSuggestions,
  getSlowMovers: getSlowMoversHandler,
  getShortagePredictions: getShortagePredictionsHandler,
  getInsights
};
