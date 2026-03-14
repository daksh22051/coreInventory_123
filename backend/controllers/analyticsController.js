const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const DeliveryOrder = require('../models/DeliveryOrder');
const Transfer = require('../models/Transfer');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const ActivityLog = require('../models/ActivityLog');
const Warehouse = require('../models/Warehouse');

exports.getDashboardStats = async (req, res) => {
  try {
    const data = await gatherAnalyticsData();
    res.json({ success: true, data });
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

async function gatherAnalyticsData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalProducts,
    lowStockProducts,
    pendingReceipts,
    pendingDeliveries,
    activeTransfers,
    totalWarehouses,
    recentLogs,
    stockByCategory,
    stockByWarehouse,
    receiptTrends,
    deliveryTrends,
    inventoryValue,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$stockQuantity', '$minStockLevel'] } }),
    Receipt.countDocuments({ status: { $in: ['draft', 'pending'] } }),
    DeliveryOrder.countDocuments({ status: { $in: ['draft', 'picking', 'packing', 'ready'] } }),
    Transfer.countDocuments({ status: 'in_transit' }),
    Warehouse.countDocuments({ isActive: true }),
    ActivityLog.find().populate('user', 'name').sort('-createdAt').limit(10),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', totalStock: { $sum: '$stockQuantity' }, count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } },
      { $sort: { totalStock: -1 } }
    ]),
    Product.aggregate([
      { $match: { isActive: true, warehouse: { $exists: true } } },
      { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'wh' } },
      { $unwind: '$wh' },
      { $group: { _id: '$wh.name', totalStock: { $sum: '$stockQuantity' }, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } }
    ]),
    Receipt.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'validated' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, totalCost: { $sum: '$totalCost' } } },
      { $sort: { _id: 1 } }
    ]),
    DeliveryOrder.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['shipped', 'delivered'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }, totalItems: { $sum: '$stockQuantity' } } }
    ]),
  ]);

  return {
    stats: {
      totalProducts,
      lowStockProducts,
      pendingReceipts,
      pendingDeliveries,
      activeTransfers,
      totalWarehouses,
      totalInventoryValue: inventoryValue[0]?.totalValue || 0,
      totalItems: inventoryValue[0]?.totalItems || 0,
    },
    stockByCategory,
    stockByWarehouse,
    receiptTrends,
    deliveryTrends,
    recentActivity: recentLogs,
  };
}

async function generateCSV(data) {
  const parser = new Parser({ flatten: true });
  return parser.parse(data);
}

async function generateExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Analytics');
  sheet.columns = Object.keys(data[0] || {}).map((key) => ({ header: key, key, width: 25 }));
  sheet.addRows(data);
  return workbook.xlsx.writeBuffer();
}

async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (error) => reject(error));

    doc.fontSize(14).text('Analytics Report', { align: 'center' });
    doc.moveDown();
    data.forEach((row) => {
      doc.fontSize(10).text(JSON.stringify(row, null, 2));
      doc.moveDown();
    });
    doc.end();
  });
}

function formatExportPayload(payload) {
  const formatted = [];

  (payload.recentActivity || []).forEach((activity) => {
    formatted.push({
      type: 'Activity',
      user: activity.user?.name,
      action: activity.action,
      details: activity.details,
      timestamp: activity.createdAt,
    });
  });

  (payload.stockByCategory || []).forEach((category) => {
    formatted.push({
      type: 'Category',
      name: category._id,
      totalStock: category.totalStock,
      value: category.totalValue,
    });
  });

  (payload.receiptTrends || []).forEach((trend) => {
    formatted.push({ type: 'ReceiptTrend', month: trend._id, orders: trend.count, revenue: trend.totalCost });
  });

  (payload.deliveryTrends || []).forEach((trend) => {
    formatted.push({ type: 'DeliveryTrend', month: trend._id, orders: trend.count, revenue: trend.totalAmount });
  });

  formatted.push({ type: 'Stats', ...payload.stats });
  return formatted;
}

exports.exportAnalyticsData = async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const payload = await gatherAnalyticsData();
    const prepared = formatExportPayload(payload);

    let buffer;
    let contentType;
    switch (format) {
      case 'excel':
        buffer = await generateExcel(prepared);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        res.attachment('analytics-report.xlsx');
        break;
      case 'pdf':
        buffer = await generatePDF(prepared);
        contentType = 'application/pdf';
        res.attachment('analytics-report.pdf');
        break;
      default:
        buffer = Buffer.from(await generateCSV(prepared));
        contentType = 'text/csv';
        res.attachment('analytics-report.csv');
        break;
    }

    res.header('Content-Type', contentType);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
