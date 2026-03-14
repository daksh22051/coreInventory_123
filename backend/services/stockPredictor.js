const Product = require('../models/Product');

const getStockPrediction = (product) => {
  const daysOfData = 30;
  const avgDailyUsage = product.stockQuantity > 0
    ? Math.max(1, Math.floor(product.maxStockLevel / daysOfData))
    : 0;

  const daysUntilStockout = avgDailyUsage > 0
    ? Math.floor(product.stockQuantity / avgDailyUsage)
    : Infinity;

  const reorderPoint = avgDailyUsage * 7; // 7-day lead time
  const shouldReorder = product.stockQuantity <= reorderPoint;
  const suggestedReorderQty = shouldReorder
    ? Math.max(product.maxStockLevel - product.stockQuantity, product.minStockLevel * 2)
    : 0;

  return {
    productId: product._id,
    productName: product.name,
    currentStock: product.stockQuantity,
    avgDailyUsage,
    daysUntilStockout: daysUntilStockout === Infinity ? 'N/A' : daysUntilStockout,
    reorderPoint,
    shouldReorder,
    suggestedReorderQty,
    riskLevel: daysUntilStockout <= 3 ? 'critical'
      : daysUntilStockout <= 7 ? 'high'
      : daysUntilStockout <= 14 ? 'medium' : 'low'
  };
};

const getSmartReorderSuggestions = async () => {
  const products = await Product.find({ isActive: true });
  return products
    .map(p => getStockPrediction(p))
    .filter(p => p.shouldReorder)
    .sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
};

module.exports = { getStockPrediction, getSmartReorderSuggestions };
