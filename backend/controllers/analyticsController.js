const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const DeliveryOrder = require('../models/DeliveryOrder');
const Transfer = require('../models/Transfer');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const ActivityLog = require('../models/ActivityLog');
const Warehouse = require('../models/Warehouse');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      lowStockProducts,
      pendingReceipts,
      pendingDeliveries,
      activeTransfers,
      totalWarehouses,
      recentLogs
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stockQuantity', '$minStockLevel'] } }),
      Receipt.countDocuments({ status: { $in: ['draft', 'pending'] } }),
      DeliveryOrder.countDocuments({ status: { $in: ['draft', 'picking', 'packing', 'ready'] } }),
      Transfer.countDocuments({ status: 'in_transit' }),
      Warehouse.countDocuments({ isActive: true }),
      ActivityLog.find().populate('user', 'name').sort('-createdAt').limit(10)
    ]);

    // Stock by category
    const stockByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', totalStock: { $sum: '$stockQuantity' }, count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } },
      { $sort: { totalStock: -1 } }
    ]);

    // Stock by warehouse
    const stockByWarehouse = await Product.aggregate([
      { $match: { isActive: true, warehouse: { $exists: true } } },
      { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'wh' } },
      { $unwind: '$wh' },
      { $group: { _id: '$wh.name', totalStock: { $sum: '$stockQuantity' }, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } }
    ]);

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

    // Total inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }, totalItems: { $sum: '$stockQuantity' } } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          lowStockProducts,
          pendingReceipts,
          pendingDeliveries,
          activeTransfers,
          totalWarehouses,
          totalInventoryValue: inventoryValue[0]?.totalValue || 0,
          totalItems: inventoryValue[0]?.totalItems || 0
        },
        stockByCategory,
        stockByWarehouse,
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
    const { page = 1, limit = 50 } = req.query;
    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
