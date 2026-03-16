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

function normalizeWarehousePayload(body = {}) {
  const normalizedCode = typeof body.code === 'string' && body.code.trim()
    ? body.code.trim().toUpperCase()
    : '';
  const address = typeof body.address === 'string' ? body.address.trim() : body.location?.address;
  const city = typeof body.city === 'string' ? body.city.trim() : body.location?.city;
  const state = typeof body.state === 'string' ? body.state.trim() : body.location?.state;
  const isActive = typeof body.active === 'boolean'
    ? body.active
    : typeof body.isActive === 'boolean'
      ? body.isActive
      : true;

  return {
    ...body,
    code: normalizedCode,
    location: {
      address: address || '',
      city: city || '',
      state: state || '',
      country: body.location?.country || 'India',
    },
    capacity: Number(body.capacity) || 10000,
    isActive,
  };
}

async function generateUniqueWarehouseCode() {
  let code = '';
  let exists = true;

  while (exists) {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    code = `WH-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Warehouse.exists({ code });
  }

  return code;
}

exports.getWarehouses = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      return res.json({ success: true, data: inMemoryWarehouses.filter(w => w.isActive && !w.isDeleted) });
    }
    const warehouses = await Warehouse.find({ isActive: true, isDeleted: { $ne: true } }).populate('manager', 'name email');
    res.json({ success: true, data: warehouses });
  } catch (error) {
    // Fallback to in-memory on error
    res.json({ success: true, data: inMemoryWarehouses.filter(w => w.isActive && !w.isDeleted) });
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
    const payload = normalizeWarehousePayload(req.body);

    if (!payload.code) {
      payload.code = await generateUniqueWarehouseCode();
    }

    if (isInMemoryMode()) {
      const existing = inMemoryWarehouses.find(w => w.code === payload.code);
      if (existing) {
        if (existing.isDeleted || existing.isActive === false) {
          const restored = {
            ...existing,
            ...payload,
            isDeleted: false,
            isActive: payload.isActive,
            updatedAt: new Date(),
          };
          inMemoryWarehouses = inMemoryWarehouses.map(w => (w._id === existing._id ? restored : w));
          return res.status(200).json({ success: true, data: restored, restored: true });
        }
        return res.status(409).json({ success: false, message: 'Warehouse code already exists' });
      }
    }

    if (isInMemoryMode()) {
      const newWarehouse = {
        _id: 'wh-' + Date.now(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryWarehouses.push(newWarehouse);
      return res.status(201).json({ success: true, data: newWarehouse });
    }

    const existingWarehouse = await Warehouse.findOne({ code: payload.code });
    if (existingWarehouse) {
      if (existingWarehouse.isDeleted || existingWarehouse.isActive === false) {
        existingWarehouse.name = payload.name;
        existingWarehouse.location = payload.location;
        existingWarehouse.capacity = payload.capacity;
        existingWarehouse.isActive = payload.isActive;
        existingWarehouse.isDeleted = false;
        const restoredWarehouse = await existingWarehouse.save();
        return res.status(200).json({ success: true, data: restoredWarehouse, restored: true });
      }
      return res.status(409).json({ success: false, message: 'Warehouse code already exists' });
    }

    const warehouse = await Warehouse.create(payload);
    await logActivity(req.user._id, 'warehouse_created', 'Warehouse', warehouse._id,
      `Warehouse ${warehouse.name} created`);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    // Fallback to in-memory if MongoDB fails
    if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
      const payload = normalizeWarehousePayload(req.body);
      if (!payload.code) {
        payload.code = 'WH-' + Date.now().toString().slice(-6);
      }

      const existing = inMemoryWarehouses.find(w => w.code === payload.code);
      if (existing) {
        if (existing.isDeleted || existing.isActive === false) {
          const restored = {
            ...existing,
            ...payload,
            isDeleted: false,
            isActive: payload.isActive,
            updatedAt: new Date(),
          };
          inMemoryWarehouses = inMemoryWarehouses.map(w => (w._id === existing._id ? restored : w));
          return res.status(200).json({ success: true, data: restored, restored: true, mode: 'demo' });
        }
        return res.status(409).json({ success: false, message: 'Warehouse code already exists' });
      }

      const newWarehouse = {
        _id: 'wh-' + Date.now(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryWarehouses.push(newWarehouse);
      return res.status(201).json({ success: true, data: newWarehouse, mode: 'demo' });
    }

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Warehouse code already exists' });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const payload = normalizeWarehousePayload(req.body);

    if (isInMemoryMode()) {
      const idx = inMemoryWarehouses.findIndex(w => w._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Warehouse not found' });
      inMemoryWarehouses[idx] = { ...inMemoryWarehouses[idx], ...payload, updatedAt: new Date() };
      return res.json({ success: true, data: inMemoryWarehouses[idx] });
    }

    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, payload, {
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
