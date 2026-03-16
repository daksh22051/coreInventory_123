const Product = require('../models/Product');
const DeliveryOrder = require('../models/DeliveryOrder');
const Receipt = require('../models/Receipt');

// Calculate actual daily usage from historical delivery data
const calculateActualUsage = async (productId, days = 90) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const deliveries = await DeliveryOrder.find({
    'items.product': productId,
    status: 'delivered',
    deliveredDate: { $gte: since }
  });

  let totalDelivered = 0;
  deliveries.forEach(d => {
    d.items.forEach(item => {
      if (item.product?.toString() === productId.toString()) {
        totalDelivered += item.quantity;
      }
    });
  });

  return totalDelivered / Math.max(days, 1);
};

const getStockPrediction = (product, avgDailyUsage = null) => {
  const daysOfData = 30;
  const usage = avgDailyUsage !== null ? avgDailyUsage
    : (product.stockQuantity > 0 ? Math.max(1, Math.floor(product.maxStockLevel / daysOfData)) : 0);

  const daysUntilStockout = usage > 0
    ? Math.floor(product.stockQuantity / usage)
    : Infinity;

  const reorderPoint = Math.ceil(usage * 7); // 7-day lead time
  const shouldReorder = product.stockQuantity <= reorderPoint;
  const suggestedReorderQty = shouldReorder
    ? Math.max(product.maxStockLevel - product.stockQuantity, product.minStockLevel * 2)
    : 0;

  return {
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    currentStock: product.stockQuantity,
    minStockLevel: product.minStockLevel,
    maxStockLevel: product.maxStockLevel,
    avgDailyUsage: Math.round(usage * 100) / 100,
    daysUntilStockout: daysUntilStockout === Infinity ? null : daysUntilStockout,
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
  const predictions = await Promise.all(
    products.map(async (p) => {
      const usage = await calculateActualUsage(p._id, 90);
      return getStockPrediction(p, usage > 0 ? usage : null);
    })
  );
  return predictions
    .filter(p => p.shouldReorder)
    .sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
};

// Detect slow-moving items: products with low delivery velocity
const getSlowMovers = async (days = 60) => {
  const products = await Product.find({ isActive: true, stockQuantity: { $gt: 0 } });
  const slowMovers = [];

  for (const product of products) {
    const usage = await calculateActualUsage(product._id, days);
    if (usage < 0.5) { // Less than 0.5 units/day
      slowMovers.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        currentStock: product.stockQuantity,
        avgDailyUsage: Math.round(usage * 100) / 100,
        stockValue: product.stockQuantity * product.costPrice,
        daysSinceLastMovement: usage === 0 ? days : Math.floor(1 / usage)
      });
    }
  }

  return slowMovers.sort((a, b) => b.stockValue - a.stockValue);
};

// Predict shortages within N days
const getShortagePredictions = async (withinDays = 30) => {
  const products = await Product.find({ isActive: true });
  const shortages = [];

  for (const product of products) {
    const usage = await calculateActualUsage(product._id, 90);
    const prediction = getStockPrediction(product, usage > 0 ? usage : null);

    if (prediction.daysUntilStockout !== null && prediction.daysUntilStockout <= withinDays) {
      shortages.push({
        ...prediction,
        predictedStockoutDate: new Date(Date.now() + prediction.daysUntilStockout * 24 * 60 * 60 * 1000)
      });
    }
  }

  return shortages.sort((a, b) => (a.daysUntilStockout || 0) - (b.daysUntilStockout || 0));
};

// Get top 5 actionable insights
const getAIInsights = async () => {
  const [reorderSuggestions, slowMovers, shortagePredictions] = await Promise.all([
    getSmartReorderSuggestions(),
    getSlowMovers(60),
    getShortagePredictions(14)
  ]);

  const insights = [];

  // Critical shortages
  shortagePredictions.slice(0, 2).forEach(p => {
    insights.push({
      type: 'shortage',
      severity: p.riskLevel,
      title: `${p.productName} running out`,
      message: `Only ${p.daysUntilStockout} days of stock left. Reorder ${p.suggestedReorderQty} ${p.category} units.`,
      action: 'reorder',
      entityId: p.productId,
      entityType: 'product'
    });
  });

  // Dead stock
  const deadStock = slowMovers.filter(s => s.avgDailyUsage === 0);
  if (deadStock.length > 0) {
    const totalValue = deadStock.reduce((sum, s) => sum + s.stockValue, 0);
    insights.push({
      type: 'dead_stock',
      severity: 'warning',
      title: `${deadStock.length} dead stock items detected`,
      message: `₹${totalValue.toLocaleString()} tied up in inventory with zero movement in 60 days.`,
      action: 'review',
      metadata: { count: deadStock.length, totalValue }
    });
  }

  // Reorder urgency
  const criticalReorders = reorderSuggestions.filter(r => r.riskLevel === 'critical');
  if (criticalReorders.length > 0) {
    insights.push({
      type: 'reorder',
      severity: 'critical',
      title: `${criticalReorders.length} products need immediate reorder`,
      message: `Critical stock levels detected. Create purchase receipts now.`,
      action: 'reorder_batch',
      metadata: { productIds: criticalReorders.map(r => r.productId) }
    });
  }

  // Slow movers
  if (slowMovers.length > 3) {
    insights.push({
      type: 'slow_movers',
      severity: 'info',
      title: `${slowMovers.length} slow-moving products`,
      message: `Consider running promotions or redistributing stock between warehouses.`,
      action: 'review_slow',
      metadata: { count: slowMovers.length }
    });
  }

  return insights.slice(0, 5);
};

module.exports = {
  getStockPrediction,
  getSmartReorderSuggestions,
  getSlowMovers,
  getShortagePredictions,
  getAIInsights,
  calculateActualUsage
};
