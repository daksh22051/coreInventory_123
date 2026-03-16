const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const DeliveryOrder = require('../models/DeliveryOrder');
const ActivityLog = require('../models/ActivityLog');
const XLSX = require('xlsx');

// Helper: convert array of objects to CSV string
const toCSV = (data, columns) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = typeof c.value === 'function' ? c.value(row) : row[c.key] ?? '';
      val = String(val).replace(/,/g, ';').replace(/\n/g, ' ');
      return `"${val}"`;
    }).join(',')
  );
  return [header, ...rows].join('\n');
};

const toTableRows = (data, columns) => data.map((row) => {
  const out = {};
  columns.forEach((c) => {
    let val = typeof c.value === 'function' ? c.value(row) : row[c.key] ?? '';
    out[c.label] = val;
  });
  return out;
});

const setAutoColumnWidths = (ws, rows, columns) => {
  const widths = columns.map((c) => {
    const headerLen = String(c.label).length;
    const maxRowLen = rows.reduce((max, row) => {
      const value = row[c.label] ?? '';
      return Math.max(max, String(value).length);
    }, 0);
    return { wch: Math.min(48, Math.max(12, headerLen + 2, maxRowLen + 2)) };
  });
  ws['!cols'] = widths;
};

const sendTabularExport = (req, res, { data, columns, filenamePrefix, reportTitle }) => {
  const format = String(req.query.format || 'csv').toLowerCase();
  const timestamp = Date.now();

  if (format === 'excel' || format === 'xlsx') {
    const rows = toTableRows(data, columns);
    const wb = XLSX.utils.book_new();

    const headingRows = [
      [`CoreInventory ${reportTitle} Report`],
      [`Generated At: ${new Date().toISOString()}`],
      [],
    ];

    const bodyRows = rows.map((r) => columns.map((c) => r[c.label] ?? ''));
    const sheetRows = [
      ...headingRows,
      columns.map((c) => c.label),
      ...bodyRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(columns.length - 1, 0) } }];
    setAutoColumnWidths(ws, rows, columns);

    const summaryWs = XLSX.utils.aoa_to_sheet([
      ['Report', reportTitle],
      ['Generated At', new Date().toLocaleString()],
      ['Total Rows', rows.length],
      ['Format', 'XLSX'],
    ]);
    summaryWs['!cols'] = [{ wch: 18 }, { wch: 36 }];

    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    XLSX.utils.book_append_sheet(wb, ws, reportTitle.slice(0, 31) || 'Report');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filenamePrefix}_${timestamp}.xlsx`);
    return res.send(buf);
  }

  const csv = '\uFEFF' + toCSV(data, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filenamePrefix}_${timestamp}.csv`);
  return res.send(csv);
};

// Export inventory as CSV
const exportInventory = async (req, res) => {
  try {
    const { category, warehouse, lowStockOnly } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (warehouse) filter.warehouse = warehouse;

    let products = await Product.find(filter)
      .populate('warehouse', 'name code')
      .lean();

    if (lowStockOnly === 'true') {
      products = products.filter(p => p.stockQuantity <= p.minStockLevel);
    }

    const columns = [
      { label: 'SKU', key: 'sku' },
      { label: 'Name', key: 'name' },
      { label: 'Category', key: 'category' },
      { label: 'Unit', key: 'unit' },
      { label: 'Stock Qty', key: 'stockQuantity' },
      { label: 'Min Stock', key: 'minStockLevel' },
      { label: 'Max Stock', key: 'maxStockLevel' },
      { label: 'Cost Price', key: 'costPrice' },
      { label: 'Sell Price', key: 'price' },
      { label: 'Stock Value', value: (r) => (r.stockQuantity * r.costPrice).toFixed(2) },
      { label: 'Warehouse', value: (r) => r.warehouse?.name || 'N/A' },
      { label: 'Barcode', key: 'barcode' },
      { label: 'Low Stock', value: (r) => r.stockQuantity <= r.minStockLevel ? 'YES' : 'NO' },
      { label: 'Created', value: (r) => new Date(r.createdAt).toISOString().split('T')[0] }
    ];

    sendTabularExport(req, res, {
      data: products,
      columns,
      filenamePrefix: 'inventory',
      reportTitle: 'Inventory',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export receipts
const exportReceipts = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const receipts = await Receipt.find(filter)
      .populate('warehouse', 'name')
      .populate('items.product', 'name sku')
      .lean();

    const rows = [];
    receipts.forEach(r => {
      (r.items || []).forEach(item => {
        rows.push({
          receiptNumber: r.receiptNumber,
          supplier: r.supplier,
          status: r.status,
          productName: item.product?.name || 'N/A',
          productSku: item.product?.sku || 'N/A',
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineTotal: (item.quantity * item.unitCost).toFixed(2),
          warehouse: r.warehouse?.name || 'N/A',
          date: new Date(r.createdAt).toISOString().split('T')[0]
        });
      });
    });

    const columns = [
      { label: 'Receipt #', key: 'receiptNumber' },
      { label: 'Supplier', key: 'supplier' },
      { label: 'Status', key: 'status' },
      { label: 'Product', key: 'productName' },
      { label: 'SKU', key: 'productSku' },
      { label: 'Quantity', key: 'quantity' },
      { label: 'Unit Cost', key: 'unitCost' },
      { label: 'Line Total', key: 'lineTotal' },
      { label: 'Warehouse', key: 'warehouse' },
      { label: 'Date', key: 'date' }
    ];

    sendTabularExport(req, res, {
      data: rows,
      columns,
      filenamePrefix: 'receipts',
      reportTitle: 'Receipts',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export deliveries
const exportDeliveries = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const deliveries = await DeliveryOrder.find(filter)
      .populate('warehouse', 'name')
      .populate('items.product', 'name sku')
      .lean();

    const rows = [];
    deliveries.forEach(d => {
      (d.items || []).forEach(item => {
        rows.push({
          orderNumber: d.orderNumber,
          customer: d.customer,
          status: d.status,
          priority: d.priority,
          productName: item.product?.name || 'N/A',
          productSku: item.product?.sku || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: (item.quantity * item.unitPrice).toFixed(2),
          warehouse: d.warehouse?.name || 'N/A',
          date: new Date(d.createdAt).toISOString().split('T')[0]
        });
      });
    });

    const columns = [
      { label: 'Order #', key: 'orderNumber' },
      { label: 'Customer', key: 'customer' },
      { label: 'Status', key: 'status' },
      { label: 'Priority', key: 'priority' },
      { label: 'Product', key: 'productName' },
      { label: 'SKU', key: 'productSku' },
      { label: 'Quantity', key: 'quantity' },
      { label: 'Unit Price', key: 'unitPrice' },
      { label: 'Line Total', key: 'lineTotal' },
      { label: 'Warehouse', key: 'warehouse' },
      { label: 'Date', key: 'date' }
    ];

    sendTabularExport(req, res, {
      data: rows,
      columns,
      filenamePrefix: 'deliveries',
      reportTitle: 'Deliveries',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export stock report (summary by category + warehouse)
const exportStockReport = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('warehouse', 'name code')
      .lean();

    const summary = {};
    products.forEach(p => {
      const key = `${p.category}|${p.warehouse?.name || 'Unassigned'}`;
      if (!summary[key]) {
        summary[key] = { category: p.category, warehouse: p.warehouse?.name || 'Unassigned', totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0 };
      }
      summary[key].totalProducts++;
      summary[key].totalStock += p.stockQuantity;
      summary[key].totalValue += p.stockQuantity * p.costPrice;
      if (p.stockQuantity <= p.minStockLevel) summary[key].lowStockCount++;
    });

    const rows = Object.values(summary);
    const columns = [
      { label: 'Category', key: 'category' },
      { label: 'Warehouse', key: 'warehouse' },
      { label: 'Total Products', key: 'totalProducts' },
      { label: 'Total Stock', key: 'totalStock' },
      { label: 'Total Value', value: (r) => r.totalValue.toFixed(2) },
      { label: 'Low Stock Items', key: 'lowStockCount' }
    ];

    sendTabularExport(req, res, {
      data: rows,
      columns,
      filenamePrefix: 'stock_report',
      reportTitle: 'Stock Report',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export activity logs
const exportActivityLogs = async (req, res) => {
  try {
    const { action, from, to } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const columns = [
      { label: 'Date', value: (r) => new Date(r.createdAt).toISOString() },
      { label: 'User', value: (r) => r.user?.name || 'System' },
      { label: 'Email', value: (r) => r.user?.email || '' },
      { label: 'Action', key: 'action' },
      { label: 'Entity', key: 'entity' },
      { label: 'Details', key: 'details' }
    ];

    sendTabularExport(req, res, {
      data: logs,
      columns,
      filenamePrefix: 'activity_logs',
      reportTitle: 'Activity Logs',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  exportInventory,
  exportReceipts,
  exportDeliveries,
  exportStockReport,
  exportActivityLogs
};
