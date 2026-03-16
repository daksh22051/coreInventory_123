const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');
const { getStockPrediction, getSmartReorderSuggestions } = require('../services/stockPredictor');
const { isInMemoryMode } = require('../config/db');
const { ensureInitialLocationStock } = require('../utils/stockByLocation');

// Demo products for in-memory mode
let DEMO_PRODUCTS = [
  { _id: '1', name: 'Laptop Dell XPS 15', sku: 'SKU-001', category: 'Electronics', price: 1299.99, stockQuantity: 45, minStockLevel: 10, unit: 'pcs', isActive: true },
  { _id: '2', name: 'Office Chair Pro', sku: 'SKU-002', category: 'Furniture', price: 299.99, stockQuantity: 8, minStockLevel: 10, unit: 'pcs', isActive: true },
  { _id: '3', name: 'Wireless Mouse MX', sku: 'SKU-003', category: 'Electronics', price: 79.99, stockQuantity: 120, minStockLevel: 20, unit: 'pcs', isActive: true },
  { _id: '4', name: 'Standing Desk 60"', sku: 'SKU-004', category: 'Furniture', price: 549.99, stockQuantity: 0, minStockLevel: 5, unit: 'pcs', isActive: true },
  { _id: '5', name: 'USB-C Hub 7-in-1', sku: 'SKU-005', category: 'Electronics', price: 49.99, stockQuantity: 200, minStockLevel: 30, unit: 'pcs', isActive: true },
  { _id: '6', name: 'Packaging Tape', sku: 'SKU-006', category: 'Packaging', price: 12.99, stockQuantity: 500, minStockLevel: 100, unit: 'rolls', isActive: true },
  { _id: '7', name: 'Steel Bolts M10', sku: 'SKU-007', category: 'Spare Parts', price: 0.99, stockQuantity: 5, minStockLevel: 50, unit: 'pcs', isActive: true },
  { _id: '8', name: 'Industrial Drill', sku: 'SKU-008', category: 'Tools', price: 189.99, stockQuantity: 32, minStockLevel: 5, unit: 'pcs', isActive: true },
  { _id: '9', name: 'Cardboard Boxes Large', sku: 'SKU-009', category: 'Packaging', price: 3.49, stockQuantity: 0, minStockLevel: 100, unit: 'pcs', isActive: true },
  { _id: '10', name: 'Monitor Stand', sku: 'SKU-010', category: 'Furniture', price: 89.99, stockQuantity: 67, minStockLevel: 10, unit: 'pcs', isActive: true },
];

exports.getProducts = async (req, res) => {
  try {
    const { search, category, lowStock, warehouse, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // In-memory mode fallback
    if (isInMemoryMode()) {
      let filtered = DEMO_PRODUCTS.filter(p => p.isActive);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      if (category) filtered = filtered.filter(p => p.category === category);
      if (lowStock === 'true') filtered = filtered.filter(p => p.stockQuantity <= p.minStockLevel);
      if (warehouse) {
        filtered = filtered.filter(p => String(p.warehouse || '') === String(warehouse));
      }
      
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + parseInt(limit));
      
      return res.json({
        success: true,
        data: paged,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) || 1 }
      });
    }

    const query = { isActive: true };
    const andFilters = [];

    if (search) {
      andFilters.push({ $or: [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ] });
    }
    if (category) query.category = category;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stockQuantity', '$minStockLevel'] };
    }
    if (warehouse) {
      andFilters.push({
        $or: [
        { warehouse },
        { 'stockByLocation.warehouse': warehouse },
      ]
      });
    }

    if (andFilters.length > 0) {
      query.$and = andFilters;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('warehouse', 'name code')
      .populate('stockByLocation.warehouse', 'name code')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const product = DEMO_PRODUCTS.find(p => p._id === req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, data: product });
    }
    const product = await Product.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('stockByLocation.warehouse', 'name code');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const prediction = getStockPrediction(product);
    res.json({ success: true, data: product, prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const newProduct = { _id: Date.now().toString(), ...req.body, isActive: true };
      if (!newProduct.stockByLocation && newProduct.warehouse && Number(newProduct.stockQuantity || 0) > 0) {
        newProduct.stockByLocation = [{ warehouse: newProduct.warehouse, rack: 'GENERAL', quantity: Number(newProduct.stockQuantity || 0) }];
      }
      DEMO_PRODUCTS.push(newProduct);
      return res.status(201).json({ success: true, data: newProduct });
    }
    req.body.createdBy = req.user._id;
    const product = await Product.create(req.body);
    ensureInitialLocationStock(product);
    await product.save();

    await logActivity(req.user._id, 'product_created', 'Product', product._id, `Product created: ${product.name}`);

    if (req.io) {
      req.io.emit('product_update', { action: 'created', product });
      if (Number(product.stockQuantity || 0) <= Number(product.minStockLevel || 0)) {
        req.io.emit('notification:new', {
          type: 'low_stock',
          productId: product._id,
          sku: product.sku,
          name: product.name,
          stockQuantity: product.stockQuantity,
          minStockLevel: product.minStockLevel,
        });
      }
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_PRODUCTS.findIndex(p => p._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });
      DEMO_PRODUCTS[idx] = { ...DEMO_PRODUCTS[idx], ...req.body };
      return res.json({ success: true, data: DEMO_PRODUCTS[idx] });
    }

    const oldProduct = await Product.findById(req.params.id).lean();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    Object.assign(product, req.body);
    ensureInitialLocationStock(product);
    await product.save();

    await logActivity(req.user._id, 'product_updated', 'Product', product._id, `Product updated: ${product.name}`, {
      changes: req.body,
      oldStock: oldProduct?.stockQuantity,
      newStock: product.stockQuantity
    });

    if (req.io) {
      req.io.emit('product_update', { action: 'updated', product });
      if (Number(product.stockQuantity || 0) <= Number(product.minStockLevel || 0)) {
        req.io.emit('notification:new', {
          type: 'low_stock',
          productId: product._id,
          sku: product.sku,
          name: product.name,
          stockQuantity: product.stockQuantity,
          minStockLevel: product.minStockLevel,
        });
      }
      if (oldProduct && oldProduct.stockQuantity !== product.stockQuantity) {
        req.io.emit('stock:updated', {
          productId: product._id,
          productName: product.name,
          oldQty: oldProduct.stockQuantity,
          newQty: product.stockQuantity,
          warehouseId: product.warehouse
        });
      }
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_PRODUCTS.findIndex(p => p._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });
      DEMO_PRODUCTS[idx].isActive = false;
      return res.json({ success: true, message: 'Product deleted' });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logActivity(req.user._id, 'product_deleted', 'Product', product._id, `Product deleted: ${product.name}`);

    if (req.io) {
      req.io.emit('product_update', { action: 'deleted', productId: req.params.id });
      req.io.emit('notification:new', { type: 'product_deleted', productId: req.params.id });
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReorderSuggestions = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const lowStock = DEMO_PRODUCTS.filter(p => p.isActive && p.stockQuantity <= p.minStockLevel);
      return res.json({ success: true, data: lowStock });
    }
    const suggestions = await getSmartReorderSuggestions();
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const lowStock = DEMO_PRODUCTS.filter(p => p.isActive && p.stockQuantity <= p.minStockLevel);
      return res.json({ success: true, data: lowStock });
    }
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    })
      .populate('warehouse', 'name code')
      .populate('stockByLocation.warehouse', 'name code');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
