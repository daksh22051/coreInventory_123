const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Receipt = require('../models/Receipt');
const DeliveryOrder = require('../models/DeliveryOrder');

// Global search across all entities
const globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { results: [] } });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');
    const results = {};

    if (type === 'all' || type === 'products') {
      results.products = await Product.find({
        isActive: true,
        $or: [
          { name: regex },
          { sku: regex },
          { description: regex },
          { barcode: regex }
        ]
      })
        .select('name sku category stockQuantity price image')
        .limit(Number(limit))
        .lean();
    }

    if (type === 'all' || type === 'warehouses') {
      results.warehouses = await Warehouse.find({
        isActive: true,
        $or: [
          { name: regex },
          { code: regex },
          { 'location.city': regex },
          { 'location.address': regex }
        ]
      })
        .select('name code location capacity currentOccupancy')
        .limit(Number(limit))
        .lean();
    }

    if (type === 'all' || type === 'receipts') {
      results.receipts = await Receipt.find({
        $or: [
          { receiptNumber: regex },
          { supplier: regex }
        ]
      })
        .select('receiptNumber supplier status totalCost createdAt')
        .limit(Number(limit))
        .lean();
    }

    if (type === 'all' || type === 'deliveries') {
      results.deliveries = await DeliveryOrder.find({
        $or: [
          { orderNumber: regex },
          { customer: regex }
        ]
      })
        .select('orderNumber customer status totalAmount createdAt')
        .limit(Number(limit))
        .lean();
    }

    // Flatten into unified results with type labels
    const unified = [];
    if (results.products) {
      results.products.forEach(p => unified.push({
        type: 'product', id: p._id, title: p.name,
        subtitle: `SKU: ${p.sku} · Stock: ${p.stockQuantity}`,
        meta: { category: p.category, price: p.price }
      }));
    }
    if (results.warehouses) {
      results.warehouses.forEach(w => unified.push({
        type: 'warehouse', id: w._id, title: w.name,
        subtitle: `Code: ${w.code} · ${w.location?.city || ''}`,
        meta: { capacity: w.capacity, occupancy: w.currentOccupancy }
      }));
    }
    if (results.receipts) {
      results.receipts.forEach(r => unified.push({
        type: 'receipt', id: r._id, title: r.receiptNumber,
        subtitle: `Supplier: ${r.supplier} · ${r.status}`,
        meta: { totalCost: r.totalCost }
      }));
    }
    if (results.deliveries) {
      results.deliveries.forEach(d => unified.push({
        type: 'delivery', id: d._id, title: d.orderNumber,
        subtitle: `Customer: ${d.customer} · ${d.status}`,
        meta: { totalAmount: d.totalAmount }
      }));
    }

    res.json({ success: true, data: { results: unified, grouped: results } });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { globalSearch };
