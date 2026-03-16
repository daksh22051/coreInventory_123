const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const DeliveryOrder = require('../models/DeliveryOrder');
const Transfer = require('../models/Transfer');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const ActivityLog = require('../models/ActivityLog');
const Warehouse = require('../models/Warehouse');

exports.getDashboardStats = async (req, res) => {
  try {
    const {
      documentType = 'all',
      status = 'all',
      warehouse,
      location,
      category,
    } = req.query;

    const warehouseFilter = warehouse || location;
    const productMatch = { isActive: true };
    if (category && category !== 'all') productMatch.category = category;
    if (warehouseFilter && warehouseFilter !== 'all') {
      productMatch.$or = [
        { warehouse: warehouseFilter },
        { 'stockByLocation.warehouse': warehouseFilter },
      ];
    }

    const shouldIncludeReceipts = documentType === 'all' || documentType === 'receipts';
    const shouldIncludeDeliveries = documentType === 'all' || documentType === 'delivery';
    const shouldIncludeTransfers = documentType === 'all' || documentType === 'internal';
    const shouldIncludeAdjustments = documentType === 'all' || documentType === 'adjustments';

    const receiptStatuses = status !== 'all' ? [status] : ['draft', 'waiting', 'ready'];
    const deliveryStatuses = status !== 'all' ? [status] : ['pending', 'picking', 'packing'];
    const transferStatuses = status !== 'all' ? [status] : ['draft', 'in_transit'];

    const receiptMatch = { status: { $in: receiptStatuses } };
    if (warehouseFilter && warehouseFilter !== 'all') receiptMatch.warehouse = warehouseFilter;

    const deliveryMatch = { status: { $in: deliveryStatuses } };
    if (warehouseFilter && warehouseFilter !== 'all') deliveryMatch.warehouse = warehouseFilter;

    const transferMatch = { status: { $in: transferStatuses } };
    if (warehouseFilter && warehouseFilter !== 'all') {
      transferMatch.$or = [{ fromWarehouse: warehouseFilter }, { toWarehouse: warehouseFilter }];
    }

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingReceipts,
      pendingDeliveries,
      activeTransfers,
      totalWarehouses,
      recentLogs,
      inventoryValue,
    ] = await Promise.all([
      Product.countDocuments(productMatch),
      Product.countDocuments({ ...productMatch, $expr: { $lte: ['$stockQuantity', '$minStockLevel'] } }),
      Product.countDocuments({ ...productMatch, stockQuantity: { $lte: 0 } }),
      shouldIncludeReceipts ? Receipt.countDocuments(receiptMatch) : 0,
      shouldIncludeDeliveries ? DeliveryOrder.countDocuments(deliveryMatch) : 0,
      shouldIncludeTransfers ? Transfer.countDocuments(transferMatch) : 0,
      Warehouse.countDocuments({ isActive: true }),
      ActivityLog.find().populate('user', 'name').sort('-createdAt').limit(10),
      Product.aggregate([
        { $match: productMatch },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }, totalItems: { $sum: '$stockQuantity' } } },
      ]),
    ]);

    // Stock by category
    const stockByCategory = await Product.aggregate([
      { $match: productMatch },
      { $group: { _id: '$category', totalStock: { $sum: '$stockQuantity' }, count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } },
      { $sort: { totalStock: -1 } }
    ]);

    // Stock by warehouse using location-level stock entries
    const stockByWarehouse = await Product.aggregate([
      { $match: productMatch },
      { $unwind: '$stockByLocation' },
      ...(warehouseFilter && warehouseFilter !== 'all'
        ? [{ $match: { 'stockByLocation.warehouse': warehouseFilter } }]
        : []),
      { $lookup: { from: 'warehouses', localField: 'stockByLocation.warehouse', foreignField: '_id', as: 'wh' } },
      { $unwind: '$wh' },
      { $group: {
        _id: '$wh._id',
        name: { $first: '$wh.name' },
        totalStock: { $sum: '$stockByLocation.quantity' },
        totalValue: { $sum: { $multiply: ['$stockByLocation.quantity', '$price'] } },
      } },
      { $sort: { totalStock: -1 } },
    ]);

    // Always expose active warehouses for dashboard filters, even if no stockByLocation rows exist yet.
    const activeWarehouses = await Warehouse.find({ isActive: true }).select('_id name').lean();
    const stockByWarehouseMap = new Map(
      stockByWarehouse.map((entry) => [String(entry._id), entry])
    );
    const stockByWarehouseWithOptions = activeWarehouses.map((warehouse) => {
      const current = stockByWarehouseMap.get(String(warehouse._id));
      return {
        _id: warehouse._id,
        name: warehouse.name,
        totalStock: current?.totalStock || 0,
        totalValue: current?.totalValue || 0,
      };
    });

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [receiptTrends, deliveryTrends] = await Promise.all([
      Receipt.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'validated' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, totalCost: { $sum: '$totalCost' } } },
        { $sort: { _id: 1 } }
      ]),
      DeliveryOrder.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['shipped', 'delivered'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          pendingReceipts,
          pendingDeliveries,
          activeTransfers,
          totalWarehouses,
          totalInventoryValue: inventoryValue[0]?.totalValue || 0,
          totalItems: inventoryValue[0]?.totalItems || 0
        },
        filters: {
          documentType,
          status,
          warehouse: warehouseFilter || 'all',
          category: category || 'all',
        },
        stockByCategory,
        stockByWarehouse: stockByWarehouseWithOptions,
        receiptTrends,
        deliveryTrends,
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity, user, from, to } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (user) filter.user = user;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / limit);
    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), pages: totalPages, totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Activity logs for a specific entity
exports.getEntityLogs = async (req, res) => {
  try {
    const { type, id } = req.params;
    const logs = await ActivityLog.find({ entity: type, entityId: id })
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Inventory turnover rate
exports.getInventoryTurnover = async (req, res) => {
  try {
    const { period = 90 } = req.query;
    const since = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

    // COGS = total cost of delivered items
    const deliveredCost = await DeliveryOrder.aggregate([
      { $match: { status: 'delivered', deliveredDate: { $gte: since } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } },
      { $unwind: '$prod' },
      { $group: {
        _id: '$prod.category',
        cogs: { $sum: { $multiply: ['$items.quantity', '$prod.costPrice'] } },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        unitsSold: { $sum: '$items.quantity' }
      }},
      { $sort: { cogs: -1 } }
    ]);

    // Average inventory value by category
    const avgInventory = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: '$category',
        avgValue: { $avg: { $multiply: ['$stockQuantity', '$costPrice'] } },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } }
      }}
    ]);

    const avgMap = {};
    avgInventory.forEach(a => { avgMap[a._id] = a; });

    const turnover = deliveredCost.map(d => ({
      category: d._id,
      cogs: d.cogs,
      revenue: d.revenue,
      unitsSold: d.unitsSold,
      avgInventoryValue: avgMap[d._id]?.totalValue || 1,
      turnoverRate: Math.round((d.cogs / (avgMap[d._id]?.totalValue || 1)) * 100) / 100
    }));

    const totalCOGS = deliveredCost.reduce((sum, d) => sum + d.cogs, 0);
    const totalAvgInv = avgInventory.reduce((sum, a) => sum + a.totalValue, 0);

    res.json({
      success: true,
      data: {
        byCategory: turnover,
        overall: {
          totalCOGS,
          totalAvgInventory: totalAvgInv,
          overallTurnoverRate: totalAvgInv > 0 ? Math.round((totalCOGS / totalAvgInv) * 100) / 100 : 0
        },
        period: Number(period)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Top selling products
exports.getTopProducts = async (req, res) => {
  try {
    const { period = 30, limit = 10 } = req.query;
    const since = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

    const topProducts = await DeliveryOrder.aggregate([
      { $match: { status: { $in: ['shipped', 'delivered'] }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        orderCount: { $sum: 1 }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: Number(limit) },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: {
        productId: '$_id',
        name: '$product.name',
        sku: '$product.sku',
        category: '$product.category',
        currentStock: '$product.stockQuantity',
        totalSold: 1,
        totalRevenue: 1,
        orderCount: 1
      }}
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dead stock detection
exports.getDeadStock = async (req, res) => {
  try {
    const { days = 60 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // Products with stock but no deliveries in the period
    const activeProductIds = await DeliveryOrder.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $in: ['shipped', 'delivered'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product' } }
    ]);

    const activeIds = activeProductIds.map(a => a._id);

    const deadStock = await Product.find({
      isActive: true,
      stockQuantity: { $gt: 0 },
      _id: { $nin: activeIds }
    })
      .populate('warehouse', 'name')
      .select('name sku category stockQuantity costPrice price warehouse updatedAt')
      .lean();

    const result = deadStock.map(p => ({
      ...p,
      stockValue: p.stockQuantity * p.costPrice,
      daysDormant: Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (24 * 60 * 60 * 1000))
    }));

    res.json({
      success: true,
      data: result.sort((a, b) => b.stockValue - a.stockValue),
      summary: {
        totalItems: result.length,
        totalValue: result.reduce((sum, r) => sum + r.stockValue, 0),
        totalUnits: result.reduce((sum, r) => sum + r.stockQuantity, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Monthly stock movement
exports.getStockMovement = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - Number(months));

    const [inbound, outbound, transfers] = await Promise.all([
      Receipt.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $in: ['done', 'validated'] } } },
        { $unwind: '$items' },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalIn: { $sum: '$items.quantity' },
          receiptCount: { $sum: 1 },
          totalCost: { $sum: { $multiply: ['$items.quantity', '$items.unitCost'] } }
        }},
        { $sort: { _id: 1 } }
      ]),
      DeliveryOrder.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $in: ['shipped', 'delivered'] } } },
        { $unwind: '$items' },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalOut: { $sum: '$items.quantity' },
          deliveryCount: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
        }},
        { $sort: { _id: 1 } }
      ]),
      Transfer.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed' } },
        { $unwind: '$items' },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalTransferred: { $sum: '$items.quantity' },
          transferCount: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    // Merge into unified monthly data
    const monthMap = {};
    const addMonths = (arr, type) => {
      arr.forEach(item => {
        if (!monthMap[item._id]) monthMap[item._id] = { month: item._id, totalIn: 0, totalOut: 0, totalTransferred: 0 };
        Object.assign(monthMap[item._id], item, { month: item._id });
      });
    };
    addMonths(inbound, 'in');
    addMonths(outbound, 'out');
    addMonths(transfers, 'transfer');

    res.json({
      success: true,
      data: Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Warehouse performance
exports.getWarehousePerformance = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).lean();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const performance = await Promise.all(warehouses.map(async (wh) => {
      const [products, receiptsIn, deliveriesOut, transfersIn, transfersOut] = await Promise.all([
        Product.find({ warehouse: wh._id, isActive: true }).lean(),
        Receipt.countDocuments({ warehouse: wh._id, status: { $in: ['done', 'validated'] }, createdAt: { $gte: thirtyDaysAgo } }),
        DeliveryOrder.countDocuments({ warehouse: wh._id, status: { $in: ['shipped', 'delivered'] }, createdAt: { $gte: thirtyDaysAgo } }),
        Transfer.countDocuments({ toWarehouse: wh._id, status: 'completed', createdAt: { $gte: thirtyDaysAgo } }),
        Transfer.countDocuments({ fromWarehouse: wh._id, status: 'completed', createdAt: { $gte: thirtyDaysAgo } })
      ]);

      const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
      const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0);
      const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockLevel).length;

      return {
        warehouseId: wh._id,
        name: wh.name,
        code: wh.code,
        location: wh.location,
        capacity: wh.capacity,
        currentOccupancy: wh.currentOccupancy,
        utilizationPercent: wh.capacity > 0 ? Math.round((totalStock / wh.capacity) * 100) : 0,
        productCount: products.length,
        totalStock,
        totalValue,
        lowStockCount,
        throughput: {
          receiptsIn,
          deliveriesOut,
          transfersIn,
          transfersOut,
          total: receiptsIn + deliveriesOut + transfersIn + transfersOut
        }
      };
    }));

    res.json({ success: true, data: performance.sort((a, b) => b.throughput.total - a.throughput.total) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Warehouse heatmap: stock levels per warehouse per category
exports.getWarehouseHeatmap = async (req, res) => {
  try {
    const data = await Product.aggregate([
      { $match: { isActive: true, warehouse: { $exists: true } } },
      { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'wh' } },
      { $unwind: '$wh' },
      { $group: {
        _id: { warehouse: '$wh.name', category: '$category' },
        totalStock: { $sum: '$stockQuantity' },
        productCount: { $sum: 1 },
        avgUtilization: { $avg: { $cond: [{ $gt: ['$maxStockLevel', 0] }, { $divide: ['$stockQuantity', '$maxStockLevel'] }, 0] } }
      }},
      { $sort: { '_id.warehouse': 1, '_id.category': 1 } }
    ]);

    // Reshape into matrix
    const warehouses = [...new Set(data.map(d => d._id.warehouse))];
    const categories = [...new Set(data.map(d => d._id.category))];
    const matrix = {};
    data.forEach(d => {
      if (!matrix[d._id.warehouse]) matrix[d._id.warehouse] = {};
      matrix[d._id.warehouse][d._id.category] = {
        stock: d.totalStock,
        products: d.productCount,
        utilization: Math.round(d.avgUtilization * 100)
      };
    });

    res.json({ success: true, data: { warehouses, categories, matrix } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stock distribution across warehouses
exports.getStockDistribution = async (req, res) => {
  try {
    const distribution = await Product.aggregate([
      { $match: { isActive: true, warehouse: { $exists: true } } },
      { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'wh' } },
      { $unwind: '$wh' },
      { $group: {
        _id: { warehouse: '$wh.name', warehouseId: '$wh._id' },
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } },
        productCount: { $sum: 1 },
        categories: { $addToSet: '$category' }
      }},
      { $sort: { totalStock: -1 } }
    ]);

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
