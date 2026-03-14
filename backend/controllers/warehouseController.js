const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');
const { isInMemoryMode } = require('../config/db');

// In-memory storage fallback
let inMemoryWarehouses = [
  {
    _id: 'wh-001',
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    location: { address: 'Industrial Area', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    capacity: 10000,
    currentOccupancy: 5000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

exports.getWarehouses = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      return res.json({ success: true, data: inMemoryWarehouses.filter(w => w.isActive) });
    }
    const warehouses = await Warehouse.find({ isActive: true }).populate('manager', 'name email');
    res.json({ success: true, data: warehouses });
  } catch (error) {
    // Fallback to in-memory on error
    res.json({ success: true, data: inMemoryWarehouses.filter(w => w.isActive) });
  }
};

exports.getWarehouse = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const warehouse = inMemoryWarehouses.find(w => w._id === req.params.id);
      if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      return res.json({ success: true, data: warehouse, stats: { productCount: 0, totalStock: 0 } });
    }

    const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'name email');
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    const productCount = await Product.countDocuments({ warehouse: warehouse._id, isActive: true });
    const totalStock = await Product.aggregate([
      { $match: { warehouse: warehouse._id, isActive: true } },
      { $group: { _id: null, total: { $sum: '$stockQuantity' } } }
    ]);

    res.json({
      success: true,
      data: warehouse,
      stats: { productCount, totalStock: totalStock[0]?.total || 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const newWarehouse = {
        _id: 'wh-' + Date.now(),
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryWarehouses.push(newWarehouse);
      return res.status(201).json({ success: true, data: newWarehouse });
    }

    const warehouse = await Warehouse.create(req.body);
    await logActivity(req.user._id, 'warehouse_created', 'Warehouse', warehouse._id,
      `Warehouse ${warehouse.name} created`);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    // Fallback to in-memory if MongoDB fails
    if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
      const newWarehouse = {
        _id: 'wh-' + Date.now(),
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryWarehouses.push(newWarehouse);
      return res.status(201).json({ success: true, data: newWarehouse, mode: 'demo' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = inMemoryWarehouses.findIndex(w => w._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      inMemoryWarehouses[idx] = { ...inMemoryWarehouses[idx], ...req.body, updatedAt: new Date() };
      return res.json({ success: true, data: inMemoryWarehouses[idx] });
    }

    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    await logActivity(req.user._id, 'warehouse_updated', 'Warehouse', warehouse._id,
      `Warehouse ${warehouse.name} updated`);
    res.json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = inMemoryWarehouses.findIndex(w => w._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      inMemoryWarehouses.splice(idx, 1);
      return res.json({ success: true, message: 'Warehouse deleted' });
    }

    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, message: 'Warehouse deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
