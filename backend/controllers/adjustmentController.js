const InventoryAdjustment = require('../models/InventoryAdjustment');
const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');

exports.getAdjustments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await InventoryAdjustment.countDocuments(query);
    const adjustments = await InventoryAdjustment.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: adjustments, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdjustment = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    // Calculate differences
    if (req.body.items) {
      req.body.items = req.body.items.map(item => ({
        ...item,
        difference: item.actualQuantity - item.systemQuantity
      }));
    }

    const adjustment = await InventoryAdjustment.create(req.body);

    await logActivity(req.user._id, 'adjustment_created', 'InventoryAdjustment', adjustment._id,
      `Adjustment ${adjustment.adjustmentNumber} created`);

    if (req.io) req.io.emit('adjustment_update', { action: 'created', adjustment });

    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyAdjustment = async (req, res) => {
  try {
    const adjustment = await InventoryAdjustment.findById(req.params.id);
    if (!adjustment) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    if (adjustment.status === 'applied') return res.status(400).json({ success: false, message: 'Already applied' });

    // Apply stock changes
    for (const item of adjustment.items) {
      await Product.findByIdAndUpdate(item.product, {
        stockQuantity: item.actualQuantity
      });
    }

    adjustment.status = 'applied';
    adjustment.approvedBy = req.user._id;
    await adjustment.save();

    await logActivity(req.user._id, 'adjustment_applied', 'InventoryAdjustment', adjustment._id,
      `Adjustment ${adjustment.adjustmentNumber} applied - stock corrected`);

    if (req.io) req.io.emit('stock_update', { action: 'adjustment_applied', adjustment });

    res.json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
