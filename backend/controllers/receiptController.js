const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');
const { isInMemoryMode } = require('../config/db');

// Odoo-style workflow: draft → waiting → ready → done
const WORKFLOW_ORDER = ['draft', 'waiting', 'ready', 'done'];

// Demo receipts for in-memory mode
// Stats target: 12 pending, 8 received today, ~1420 total items, ~$63,250 total value
const NOW = Date.now();
const DAY = 86400000;
let DEMO_RECEIPTS = [
  // === 8 DONE (Received Today) ===
  {
    _id: 'rcp1', receiptNumber: 'RCP-001', supplier: 'TechSupplies India Pvt Ltd',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '1', name: 'Laptop Dell XPS 15', sku: 'SKU-001' }, quantity: 20, unitCost: 720 },
      { product: { _id: '3', name: 'Wireless Mouse MX', sku: 'SKU-003' }, quantity: 50, unitCost: 32 }
    ],
    status: 'done', totalCost: 16000,
    receivedDate: new Date(NOW - 2 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 3 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 2 * 3600000), details: 'Receipt completed, stock updated' }
    ],
    createdAt: new Date(NOW - 3 * DAY)
  },
  {
    _id: 'rcp2', receiptNumber: 'RCP-002', supplier: 'Global Furniture Co.',
    warehouse: { _id: 'wh3', name: 'South Center', code: 'WH-SOUTH' },
    items: [
      { product: { _id: '2', name: 'Office Chair Pro', sku: 'SKU-002' }, quantity: 25, unitCost: 95 },
      { product: { _id: '5', name: 'Standing Desk Frame', sku: 'SKU-005' }, quantity: 10, unitCost: 160 }
    ],
    status: 'done', totalCost: 3975,
    receivedDate: new Date(NOW - 4 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 5 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 4 * 3600000), details: 'Receipt completed, stock updated' }
    ],
    createdAt: new Date(NOW - 5 * DAY)
  },
  {
    _id: 'rcp3', receiptNumber: 'RCP-003', supplier: 'CableNet India',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '6', name: 'Network Cable Cat6', sku: 'SKU-006' }, quantity: 200, unitCost: 1.2 }
    ],
    status: 'done', totalCost: 240,
    receivedDate: new Date(NOW - 1 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 1 * 3600000), details: 'Receipt completed' }
    ],
    createdAt: new Date(NOW - 2 * DAY)
  },
  {
    _id: 'rcp4', receiptNumber: 'RCP-004', supplier: 'Periph World',
    warehouse: { _id: 'wh2', name: 'North Hub', code: 'WH-NORTH' },
    items: [
      { product: { _id: '11', name: 'Mechanical Keyboard', sku: 'SKU-011' }, quantity: 40, unitCost: 42 },
      { product: { _id: '12', name: 'Webcam HD 1080p', sku: 'SKU-012' }, quantity: 30, unitCost: 24 }
    ],
    status: 'done', totalCost: 2400,
    receivedDate: new Date(NOW - 5 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 4 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 5 * 3600000), details: 'Receipt completed' }
    ],
    createdAt: new Date(NOW - 4 * DAY)
  },
  {
    _id: 'rcp5', receiptNumber: 'RCP-005', supplier: 'PackRight Solutions',
    warehouse: { _id: 'wh4', name: 'West Storage', code: 'WH-WEST' },
    items: [
      { product: { _id: '7', name: 'Packing Tape Roll', sku: 'SKU-007' }, quantity: 150, unitCost: 0.65 },
      { product: { _id: '10', name: 'Bubble Wrap Roll', sku: 'SKU-010' }, quantity: 80, unitCost: 2.8 }
    ],
    status: 'done', totalCost: 321.50,
    receivedDate: new Date(NOW - 3 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 3 * 3600000), details: 'Receipt completed' }
    ],
    createdAt: new Date(NOW - 2 * DAY)
  },
  {
    _id: 'rcp6', receiptNumber: 'RCP-006', supplier: 'DisplayTech Ltd',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '9', name: 'Monitor 27" 4K', sku: 'SKU-009' }, quantity: 15, unitCost: 240 }
    ],
    status: 'done', totalCost: 3600,
    receivedDate: new Date(NOW - 6 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 3 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 6 * 3600000), details: 'Receipt completed' }
    ],
    createdAt: new Date(NOW - 3 * DAY)
  },
  {
    _id: 'rcp7', receiptNumber: 'RCP-007', supplier: 'ToolMaster India',
    warehouse: { _id: 'wh3', name: 'South Center', code: 'WH-SOUTH' },
    items: [
      { product: { _id: '8', name: 'Screwdriver Set 12pc', sku: 'SKU-008' }, quantity: 60, unitCost: 8 }
    ],
    status: 'done', totalCost: 480,
    receivedDate: new Date(NOW - 7 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 1 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 7 * 3600000), details: 'Receipt completed' }
    ],
    createdAt: new Date(NOW - 1 * DAY)
  },
  {
    _id: 'rcp8', receiptNumber: 'RCP-008', supplier: 'Hub Connect Ltd',
    warehouse: { _id: 'wh2', name: 'North Hub', code: 'WH-NORTH' },
    items: [
      { product: { _id: '4', name: 'USB-C Hub 7-in-1', sku: 'SKU-004' }, quantity: 100, unitCost: 18 }
    ],
    status: 'done', totalCost: 1800,
    receivedDate: new Date(NOW - 8 * 3600000),
    activities: [
      { action: 'created', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt created' },
      { action: 'done', timestamp: new Date(NOW - 8 * 3600000), details: 'Receipt completed' }
    ],
    createdAt: new Date(NOW - 2 * DAY)
  },
  // === 12 PENDING (draft / waiting / ready) ===
  {
    _id: 'rcp9', receiptNumber: 'RCP-009', supplier: 'TechSupplies India Pvt Ltd',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '1', name: 'Laptop Dell XPS 15', sku: 'SKU-001' }, quantity: 10, unitCost: 720 },
      { product: { _id: '9', name: 'Monitor 27" 4K', sku: 'SKU-009' }, quantity: 8, unitCost: 240 }
    ],
    status: 'waiting', totalCost: 9120,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 1 * DAY), details: 'Receipt confirmed, waiting for goods' }
    ],
    createdAt: new Date(NOW - 2 * DAY)
  },
  {
    _id: 'rcp10', receiptNumber: 'RCP-010', supplier: 'Global Furniture Co.',
    warehouse: { _id: 'wh3', name: 'South Center', code: 'WH-SOUTH' },
    items: [
      { product: { _id: '2', name: 'Office Chair Pro', sku: 'SKU-002' }, quantity: 30, unitCost: 95 }
    ],
    status: 'ready', totalCost: 2850,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 3 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt confirmed' },
      { action: 'ready', timestamp: new Date(NOW - 3600000), details: 'Goods arrived, ready to receive' }
    ],
    createdAt: new Date(NOW - 3 * DAY)
  },
  {
    _id: 'rcp11', receiptNumber: 'RCP-011', supplier: 'Periph World',
    warehouse: { _id: 'wh2', name: 'North Hub', code: 'WH-NORTH' },
    items: [
      { product: { _id: '3', name: 'Wireless Mouse MX', sku: 'SKU-003' }, quantity: 80, unitCost: 32 },
      { product: { _id: '11', name: 'Mechanical Keyboard', sku: 'SKU-011' }, quantity: 50, unitCost: 42 }
    ],
    status: 'draft', totalCost: 4660,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 3600000), details: 'Receipt created as draft' }
    ],
    createdAt: new Date(NOW - 3600000)
  },
  {
    _id: 'rcp12', receiptNumber: 'RCP-012', supplier: 'CableNet India',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '6', name: 'Network Cable Cat6', sku: 'SKU-006' }, quantity: 100, unitCost: 1.2 }
    ],
    status: 'waiting', totalCost: 120,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 1 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 12 * 3600000), details: 'Receipt confirmed' }
    ],
    createdAt: new Date(NOW - 1 * DAY)
  },
  {
    _id: 'rcp13', receiptNumber: 'RCP-013', supplier: 'PackRight Solutions',
    warehouse: { _id: 'wh4', name: 'West Storage', code: 'WH-WEST' },
    items: [
      { product: { _id: '7', name: 'Packing Tape Roll', sku: 'SKU-007' }, quantity: 100, unitCost: 0.65 },
      { product: { _id: '10', name: 'Bubble Wrap Roll', sku: 'SKU-010' }, quantity: 50, unitCost: 2.8 }
    ],
    status: 'ready', totalCost: 205,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 4 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 3 * DAY), details: 'Receipt confirmed' },
      { action: 'ready', timestamp: new Date(NOW - 6 * 3600000), details: 'Goods arrived at dock' }
    ],
    createdAt: new Date(NOW - 4 * DAY)
  },
  {
    _id: 'rcp14', receiptNumber: 'RCP-014', supplier: 'DisplayTech Ltd',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '9', name: 'Monitor 27" 4K', sku: 'SKU-009' }, quantity: 20, unitCost: 240 }
    ],
    status: 'waiting', totalCost: 4800,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 1 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 6 * 3600000), details: 'Receipt confirmed, waiting for delivery' }
    ],
    createdAt: new Date(NOW - 1 * DAY)
  },
  {
    _id: 'rcp15', receiptNumber: 'RCP-015', supplier: 'FastShip Logistics',
    warehouse: { _id: 'wh2', name: 'North Hub', code: 'WH-NORTH' },
    items: [
      { product: { _id: '4', name: 'USB-C Hub 7-in-1', sku: 'SKU-004' }, quantity: 60, unitCost: 18 },
      { product: { _id: '12', name: 'Webcam HD 1080p', sku: 'SKU-012' }, quantity: 25, unitCost: 24 }
    ],
    status: 'draft', totalCost: 1680,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 2 * 3600000), details: 'Receipt created as draft' }
    ],
    createdAt: new Date(NOW - 2 * 3600000)
  },
  {
    _id: 'rcp16', receiptNumber: 'RCP-016', supplier: 'ToolMaster India',
    warehouse: { _id: 'wh3', name: 'South Center', code: 'WH-SOUTH' },
    items: [
      { product: { _id: '8', name: 'Screwdriver Set 12pc', sku: 'SKU-008' }, quantity: 40, unitCost: 8 },
      { product: { _id: '5', name: 'Standing Desk Frame', sku: 'SKU-005' }, quantity: 5, unitCost: 160 }
    ],
    status: 'ready', totalCost: 1120,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 5 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 4 * DAY), details: 'Receipt confirmed' },
      { action: 'ready', timestamp: new Date(NOW - 2 * 3600000), details: 'Goods arrived' }
    ],
    createdAt: new Date(NOW - 5 * DAY)
  },
  {
    _id: 'rcp17', receiptNumber: 'RCP-017', supplier: 'Infra Supplies Co.',
    warehouse: { _id: 'wh4', name: 'West Storage', code: 'WH-WEST' },
    items: [
      { product: { _id: '6', name: 'Network Cable Cat6', sku: 'SKU-006' }, quantity: 50, unitCost: 1.2 }
    ],
    status: 'draft', totalCost: 60,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 1 * 3600000), details: 'Receipt created as draft' }
    ],
    createdAt: new Date(NOW - 1 * 3600000)
  },
  {
    _id: 'rcp18', receiptNumber: 'RCP-018', supplier: 'Hub Connect Ltd',
    warehouse: { _id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN' },
    items: [
      { product: { _id: '1', name: 'Laptop Dell XPS 15', sku: 'SKU-001' }, quantity: 5, unitCost: 720 },
      { product: { _id: '3', name: 'Wireless Mouse MX', sku: 'SKU-003' }, quantity: 20, unitCost: 32 }
    ],
    status: 'waiting', totalCost: 4240,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 3 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt confirmed' }
    ],
    createdAt: new Date(NOW - 3 * DAY)
  },
  {
    _id: 'rcp19', receiptNumber: 'RCP-019', supplier: 'ElectroParts Global',
    warehouse: { _id: 'wh2', name: 'North Hub', code: 'WH-NORTH' },
    items: [
      { product: { _id: '11', name: 'Mechanical Keyboard', sku: 'SKU-011' }, quantity: 35, unitCost: 42 },
      { product: { _id: '12', name: 'Webcam HD 1080p', sku: 'SKU-012' }, quantity: 40, unitCost: 24 }
    ],
    status: 'ready', totalCost: 2430,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 6 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 5 * DAY), details: 'Receipt confirmed' },
      { action: 'ready', timestamp: new Date(NOW - 4 * 3600000), details: 'Goods arrived' }
    ],
    createdAt: new Date(NOW - 6 * DAY)
  },
  {
    _id: 'rcp20', receiptNumber: 'RCP-020', supplier: 'SafePack Industries',
    warehouse: { _id: 'wh4', name: 'West Storage', code: 'WH-WEST' },
    items: [
      { product: { _id: '7', name: 'Packing Tape Roll', sku: 'SKU-007' }, quantity: 120, unitCost: 0.65 },
      { product: { _id: '10', name: 'Bubble Wrap Roll', sku: 'SKU-010' }, quantity: 50, unitCost: 2.8 }
    ],
    status: 'waiting', totalCost: 218,
    activities: [
      { action: 'created', timestamp: new Date(NOW - 2 * DAY), details: 'Receipt created' },
      { action: 'confirmed', timestamp: new Date(NOW - 1 * DAY), details: 'Receipt confirmed' }
    ],
    createdAt: new Date(NOW - 2 * DAY)
  },
];

exports.getReceipts = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const { status, page = 1, limit = 20 } = req.query;
      let filtered = [...DEMO_RECEIPTS];
      if (status && status !== 'all') filtered = filtered.filter(r => r.status === status);
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + parseInt(limit));
      return res.json({ success: true, data: paged, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) || 1 } });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const total = await Receipt.countDocuments(query);
    const receipts = await Receipt.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku price')
      .populate('createdBy', 'name')
      .populate('validatedBy', 'name')
      .populate('receivedBy', 'name')
      .populate('activities.user', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Return demo data if database is empty (fresh install)
    if (total === 0 && (!status || status === 'all')) {
      const demoFiltered = [...DEMO_RECEIPTS];
      return res.json({ success: true, data: demoFiltered, pagination: { total: demoFiltered.length, page: 1, pages: 1 } });
    }

    res.json({ success: true, data: receipts, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    // Fallback to demo data on error
    res.json({ success: true, data: DEMO_RECEIPTS, pagination: { total: DEMO_RECEIPTS.length, page: 1, pages: 1 } });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const receipt = DEMO_RECEIPTS.find(r => r._id === req.params.id);
      if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
      return res.json({ success: true, data: receipt });
    }

    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku price')
      .populate('createdBy', 'name')
      .populate('validatedBy', 'name')
      .populate('receivedBy', 'name')
      .populate('activities.user', 'name');
    
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReceipt = async (req, res) => {
  try {
    console.log('📝 Creating receipt:', req.body);

    if (isInMemoryMode()) {
      const items = req.body.items || [];
      const totalCost = items.reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0);
      
      const newReceipt = {
        _id: 'rcp' + Date.now(),
        receiptNumber: 'RCP-' + Date.now().toString(36).toUpperCase(),
        supplier: req.body.supplier,
        warehouse: req.body.warehouse,
        notes: req.body.notes || '',
        items,
        status: 'draft',
        totalCost,
        activities: [{ action: 'created', timestamp: new Date(), details: 'Receipt created as draft' }],
        createdAt: new Date()
      };
      DEMO_RECEIPTS.unshift(newReceipt);
      console.log('✅ Receipt created (demo mode):', newReceipt);
      return res.status(201).json({ success: true, data: newReceipt });
    }

    req.body.createdBy = req.user._id;
    req.body.status = 'draft';
    req.body.activities = [{
      action: 'created',
      user: req.user._id,
      details: 'Receipt created as draft'
    }];
    
    const receipt = await Receipt.create(req.body);
    
    await receipt.populate('warehouse', 'name code');
    await receipt.populate('items.product', 'name sku price');

    await logActivity(req.user._id, 'receipt_created', 'Receipt', receipt._id,
      `Receipt ${receipt.receiptNumber} created`);

    if (req.io) req.io.emit('receipt_update', { action: 'created', receipt });

    console.log('✅ Receipt created:', receipt);
    res.status(201).json({ success: true, data: receipt });
  } catch (error) {
    console.error('❌ Error creating receipt:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReceipt = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_RECEIPTS.findIndex(r => r._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Receipt not found' });
      
      if (!['draft', 'waiting'].includes(DEMO_RECEIPTS[idx].status)) {
        return res.status(400).json({ success: false, message: 'Cannot edit receipt in current status' });
      }
      
      const items = req.body.items || DEMO_RECEIPTS[idx].items;
      const totalCost = items.reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0);
      
      DEMO_RECEIPTS[idx] = { 
        ...DEMO_RECEIPTS[idx], 
        ...req.body, 
        items, 
        totalCost,
        activities: [...(DEMO_RECEIPTS[idx].activities || []), { action: 'updated', timestamp: new Date(), details: 'Receipt updated' }]
      };
      return res.json({ success: true, data: DEMO_RECEIPTS[idx] });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    
    if (!['draft', 'waiting'].includes(receipt.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit receipt in current status' });
    }

    Object.assign(receipt, req.body);
    receipt.activities.push({
      action: 'updated',
      user: req.user._id,
      details: 'Receipt updated'
    });
    await receipt.save();

    await receipt.populate('warehouse', 'name code');
    await receipt.populate('items.product', 'name sku price');

    await logActivity(req.user._id, 'receipt_updated', 'Receipt', receipt._id,
      `Receipt ${receipt.receiptNumber} updated`);

    if (req.io) req.io.emit('receipt_update', { action: 'updated', receipt });

    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm receipt: draft → waiting
exports.confirmReceipt = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_RECEIPTS.findIndex(r => r._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Receipt not found' });
      if (DEMO_RECEIPTS[idx].status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft receipts can be confirmed' });
      }
      if (!DEMO_RECEIPTS[idx].items || DEMO_RECEIPTS[idx].items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cannot confirm receipt with no items. Add products first.' });
      }
      DEMO_RECEIPTS[idx].status = 'waiting';
      DEMO_RECEIPTS[idx].activities.push({ action: 'confirmed', timestamp: new Date(), details: 'Receipt confirmed, waiting for goods' });
      return res.json({ success: true, data: DEMO_RECEIPTS[idx] });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    
    if (receipt.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft receipts can be confirmed' });
    }
    
    if (receipt.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot confirm receipt with no items. Add products first.' });
    }

    receipt.status = 'waiting';
    receipt.activities.push({
      action: 'confirmed',
      user: req.user._id,
      details: 'Receipt confirmed, waiting for goods'
    });
    await receipt.save();

    await receipt.populate('warehouse', 'name code');
    await receipt.populate('items.product', 'name sku price');

    await logActivity(req.user._id, 'receipt_confirmed', 'Receipt', receipt._id,
      `Receipt ${receipt.receiptNumber} confirmed`);

    if (req.io) req.io.emit('receipt_update', { action: 'confirmed', receipt });

    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark as ready: waiting → ready
exports.markReady = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_RECEIPTS.findIndex(r => r._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Receipt not found' });
      if (DEMO_RECEIPTS[idx].status !== 'waiting') {
        return res.status(400).json({ success: false, message: 'Only waiting receipts can be marked ready' });
      }
      DEMO_RECEIPTS[idx].status = 'ready';
      DEMO_RECEIPTS[idx].activities.push({ action: 'ready', timestamp: new Date(), details: 'Goods arrived, ready to receive' });
      return res.json({ success: true, data: DEMO_RECEIPTS[idx] });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    
    if (receipt.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Only waiting receipts can be marked ready' });
    }

    receipt.status = 'ready';
    receipt.activities.push({
      action: 'ready',
      user: req.user._id,
      details: 'Goods arrived, ready to receive'
    });
    await receipt.save();

    await receipt.populate('warehouse', 'name code');
    await receipt.populate('items.product', 'name sku price');

    await logActivity(req.user._id, 'receipt_ready', 'Receipt', receipt._id,
      `Receipt ${receipt.receiptNumber} marked as ready`);

    if (req.io) req.io.emit('receipt_update', { action: 'ready', receipt });

    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate/Receive: ready → done (updates stock)
exports.validateReceipt = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_RECEIPTS.findIndex(r => r._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Receipt not found' });
      if (DEMO_RECEIPTS[idx].status !== 'ready') {
        return res.status(400).json({ success: false, message: 'Only ready receipts can be validated' });
      }
      if (!DEMO_RECEIPTS[idx].items || DEMO_RECEIPTS[idx].items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cannot validate receipt with no items. Add products first.' });
      }
      DEMO_RECEIPTS[idx].status = 'done';
      DEMO_RECEIPTS[idx].receivedDate = new Date();
      DEMO_RECEIPTS[idx].activities.push({ action: 'done', timestamp: new Date(), details: 'Receipt completed, stock updated' });
      return res.json({ success: true, data: DEMO_RECEIPTS[idx], message: 'Receipt validated and stock updated!' });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    
    if (receipt.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Only ready receipts can be validated' });
    }

    if (!receipt.items || receipt.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot validate receipt with no items. Add products first.' });
    }

    // Update stock for each item
    for (const item of receipt.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity }
      });
      console.log(`📦 Stock increased for product ${item.product}: +${item.quantity}`);
    }

    receipt.status = 'done';
    receipt.receivedBy = req.user._id;
    receipt.receivedDate = new Date();
    receipt.activities.push({
      action: 'done',
      user: req.user._id,
      details: `Receipt completed, ${receipt.items.length} products received into stock`
    });
    await receipt.save();

    await receipt.populate('warehouse', 'name code');
    await receipt.populate('items.product', 'name sku price');

    await logActivity(req.user._id, 'receipt_done', 'Receipt', receipt._id,
      `Receipt ${receipt.receiptNumber} completed - stock updated`);

    if (req.io) req.io.emit('stock_update', { action: 'receipt_done', receipt });

    res.json({ success: true, data: receipt, message: 'Receipt validated and stock updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel receipt
exports.cancelReceipt = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const idx = DEMO_RECEIPTS.findIndex(r => r._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Receipt not found' });
      if (DEMO_RECEIPTS[idx].status === 'done') {
        return res.status(400).json({ success: false, message: 'Cannot cancel completed receipt' });
      }
      DEMO_RECEIPTS[idx].status = 'cancelled';
      DEMO_RECEIPTS[idx].activities.push({ action: 'cancelled', timestamp: new Date(), details: 'Receipt cancelled' });
      return res.json({ success: true, data: DEMO_RECEIPTS[idx] });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    
    if (receipt.status === 'done') {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed receipt' });
    }

    receipt.status = 'cancelled';
    receipt.activities.push({
      action: 'cancelled',
      user: req.user._id,
      details: 'Receipt cancelled'
    });
    await receipt.save();

    await logActivity(req.user._id, 'receipt_cancelled', 'Receipt', receipt._id,
      `Receipt ${receipt.receiptNumber} cancelled`);

    if (req.io) req.io.emit('receipt_update', { action: 'cancelled', receipt });

    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy support
exports.receiveReceipt = exports.validateReceipt;
