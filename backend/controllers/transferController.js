const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');
const { applyDeltaByLocation, ensureInitialLocationStock } = require('../utils/stockByLocation');

exports.getTransfers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Transfer.countDocuments(query);
    const transfers = await Transfer.find(query)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: transfers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const transfer = await Transfer.create(req.body);

    await logActivity(req.user._id, 'transfer_created', 'Transfer', transfer._id,
      `Transfer ${transfer.transferNumber} created`);

    if (req.io) req.io.emit('transfer_update', { action: 'created', transfer });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status === 'completed') return res.status(400).json({ success: false, message: 'Already completed' });

    const fromWarehouseId = String(transfer.fromWarehouse);
    const toWarehouseId = String(transfer.toWarehouse);
    const isCrossWarehouse = fromWarehouseId !== toWarehouseId;

    if (isCrossWarehouse) {
      const quantitiesByProduct = transfer.items.reduce((acc, item) => {
        const key = String(item.product);
        acc[key] = (acc[key] || 0) + Number(item.quantity || 0);
        return acc;
      }, {});

      const productIds = Object.keys(quantitiesByProduct);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map((product) => [String(product._id), product]));

      for (const productId of productIds) {
        const product = productMap.get(productId);
        if (!product) {
          return res.status(400).json({ success: false, message: 'Transfer contains an invalid product' });
        }

        ensureInitialLocationStock(product);

        const moveQty = quantitiesByProduct[productId];
        if (moveQty <= 0) {
          return res.status(400).json({ success: false, message: 'Transfer item quantity must be greater than zero' });
        }

        const sourceLocation = (product.stockByLocation || []).find(
          (loc) => String(loc.warehouse) === fromWarehouseId
        );

        if (Number(sourceLocation?.quantity || 0) < moveQty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock at source location for ${product.name}. Available: ${sourceLocation?.quantity || 0}, Required: ${moveQty}`,
          });
        }
      }

      for (const productId of productIds) {
        const product = productMap.get(productId);
        if (!product) continue;

        const moveQty = quantitiesByProduct[productId];
        const removeResult = applyDeltaByLocation(product, {
          warehouseId: transfer.fromWarehouse,
          quantityDelta: -moveQty,
        });

        if (!removeResult.success) {
          return res.status(400).json({ success: false, message: `${removeResult.message} (${product.name})` });
        }

        applyDeltaByLocation(product, {
          warehouseId: transfer.toWarehouse,
          quantityDelta: moveQty,
        });

        product.warehouse = transfer.toWarehouse;
        await product.save();
      }
    }

    transfer.status = 'completed';
    transfer.completedDate = new Date();
    await transfer.save();

    await logActivity(req.user._id, 'transfer_completed', 'Transfer', transfer._id,
      `Transfer ${transfer.transferNumber} completed`);

    if (req.io) {
      req.io.emit('transfer_update', { action: 'completed', transfer });
      req.io.emit('transfer:completed', { transferId: transfer._id, from: transfer.fromWarehouse, to: transfer.toWarehouse });
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
