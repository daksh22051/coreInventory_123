const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');

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

    transfer.status = 'completed';
    transfer.completedDate = new Date();
    await transfer.save();

    await logActivity(req.user._id, 'transfer_completed', 'Transfer', transfer._id,
      `Transfer ${transfer.transferNumber} completed`);

    if (req.io) req.io.emit('transfer_update', { action: 'completed', transfer });

    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
