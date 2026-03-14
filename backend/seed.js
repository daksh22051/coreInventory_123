require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const Receipt = require('./models/Receipt');
const DeliveryOrder = require('./models/DeliveryOrder');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Warehouse.deleteMany({}),
      Product.deleteMany({}),
      Receipt.deleteMany({}),
      DeliveryOrder.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // --- Users ---
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Daksh Khamar',
      email: 'admin@coreinventory.com',
      password: hashedPassword,
      role: 'admin',
    });
    const staff = await User.create({
      name: 'Rahul Sharma',
      email: 'staff@coreinventory.com',
      password: hashedPassword,
      role: 'staff',
    });
    console.log('Users created');

    // --- Warehouses ---
    const warehouses = await Warehouse.insertMany([
      { name: 'Main Warehouse', code: 'WH-MAIN', location: { address: 'Plot 12, MIDC Industrial Area', city: 'Mumbai', state: 'Maharashtra', country: 'India' }, capacity: 15000, currentOccupancy: 8500, isActive: true, manager: admin._id },
      { name: 'North Hub', code: 'WH-NORTH', location: { address: '45 Sector 62', city: 'Noida', state: 'Uttar Pradesh', country: 'India' }, capacity: 10000, currentOccupancy: 6200, isActive: true, manager: staff._id },
      { name: 'South Center', code: 'WH-SOUTH', location: { address: '78 Electronic City', city: 'Bangalore', state: 'Karnataka', country: 'India' }, capacity: 12000, currentOccupancy: 4800, isActive: true },
      { name: 'West Storage', code: 'WH-WEST', location: { address: '23 Sanand GIDC', city: 'Ahmedabad', state: 'Gujarat', country: 'India' }, capacity: 8000, currentOccupancy: 2100, isActive: true },
    ]);
    console.log('Warehouses created');

    // --- Products ---
    const products = await Product.insertMany([
      { name: 'Laptop Dell XPS 15', sku: 'SKU-001', category: 'Electronics', unit: 'pcs', price: 89999, costPrice: 72000, stockQuantity: 45, minStockLevel: 10, warehouse: warehouses[0]._id, createdBy: admin._id, description: 'High-performance laptop for business use' },
      { name: 'Office Chair Pro', sku: 'SKU-002', category: 'Furniture', unit: 'pcs', price: 15999, costPrice: 9500, stockQuantity: 8, minStockLevel: 15, warehouse: warehouses[0]._id, createdBy: admin._id, description: 'Ergonomic office chair with lumbar support' },
      { name: 'Wireless Mouse MX', sku: 'SKU-003', category: 'Electronics', unit: 'pcs', price: 4999, costPrice: 3200, stockQuantity: 120, minStockLevel: 20, warehouse: warehouses[1]._id, createdBy: admin._id, description: 'Wireless ergonomic mouse' },
      { name: 'USB-C Hub 7-in-1', sku: 'SKU-004', category: 'Electronics', unit: 'pcs', price: 3499, costPrice: 1800, stockQuantity: 200, minStockLevel: 30, warehouse: warehouses[1]._id, createdBy: admin._id },
      { name: 'Standing Desk Frame', sku: 'SKU-005', category: 'Furniture', unit: 'pcs', price: 24999, costPrice: 16000, stockQuantity: 15, minStockLevel: 5, warehouse: warehouses[2]._id, createdBy: admin._id },
      { name: 'Network Cable Cat6', sku: 'SKU-006', category: 'Raw Materials', unit: 'meters', price: 25, costPrice: 12, stockQuantity: 5000, minStockLevel: 500, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Packing Tape Roll', sku: 'SKU-007', category: 'Packaging', unit: 'pcs', price: 120, costPrice: 65, stockQuantity: 350, minStockLevel: 100, warehouse: warehouses[3]._id, createdBy: admin._id },
      { name: 'Screwdriver Set 12pc', sku: 'SKU-008', category: 'Tools', unit: 'boxes', price: 1499, costPrice: 800, stockQuantity: 60, minStockLevel: 10, warehouse: warehouses[2]._id, createdBy: admin._id },
      { name: 'Monitor 27" 4K', sku: 'SKU-009', category: 'Electronics', unit: 'pcs', price: 32999, costPrice: 24000, stockQuantity: 30, minStockLevel: 5, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Bubble Wrap Roll', sku: 'SKU-010', category: 'Packaging', unit: 'pcs', price: 450, costPrice: 280, stockQuantity: 0, minStockLevel: 50, warehouse: warehouses[3]._id, createdBy: admin._id },
      { name: 'Mechanical Keyboard', sku: 'SKU-011', category: 'Electronics', unit: 'pcs', price: 6999, costPrice: 4200, stockQuantity: 75, minStockLevel: 15, warehouse: warehouses[1]._id, createdBy: admin._id },
      { name: 'Webcam HD 1080p', sku: 'SKU-012', category: 'Electronics', unit: 'pcs', price: 3999, costPrice: 2400, stockQuantity: 90, minStockLevel: 20, warehouse: warehouses[1]._id, createdBy: admin._id },
    ]);
    console.log('Products created');

    // --- Receipts ---
    // Stats target: 12 pending, 8 received today, ~1420 items, ~$63,250 value
    const now = Date.now();
    const DAY = 86400000;
    await Receipt.create([
      // === 8 DONE (Received Today) ===
      {
        receiptNumber: 'RCP-001',
        supplier: 'TechSupplies India Pvt Ltd',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[0]._id, quantity: 20, unitCost: 72000 },
          { product: products[2]._id, quantity: 50, unitCost: 3200 },
        ],
        status: 'done',
        notes: 'Monthly electronics restock',
        receivedDate: new Date(now - 2 * 3600000),
        receivedBy: admin._id,
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 3 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - DAY), details: 'Goods arrived at dock' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 2 * 3600000), details: 'Receipt completed, stock updated' },
        ],
        createdAt: new Date(now - 3 * DAY),
      },
      {
        receiptNumber: 'RCP-002',
        supplier: 'Global Furniture Co.',
        warehouse: warehouses[2]._id,
        items: [
          { product: products[1]._id, quantity: 25, unitCost: 9500 },
          { product: products[4]._id, quantity: 10, unitCost: 16000 },
        ],
        status: 'done',
        notes: 'Furniture order for new office setup',
        receivedDate: new Date(now - 4 * 3600000),
        receivedBy: admin._id,
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 5 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 4 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 2 * DAY), details: 'Goods arrived' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 4 * 3600000), details: 'Receipt completed, stock updated' },
        ],
        createdAt: new Date(now - 5 * DAY),
      },
      {
        receiptNumber: 'RCP-003',
        supplier: 'CableNet India',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[5]._id, quantity: 200, unitCost: 12 },
        ],
        status: 'done',
        notes: 'Network infrastructure cables',
        receivedDate: new Date(now - 1 * 3600000),
        receivedBy: staff._id,
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 6 * 3600000), details: 'Goods arrived' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 1 * 3600000), details: 'Receipt completed' },
        ],
        createdAt: new Date(now - 2 * DAY),
      },
      {
        receiptNumber: 'RCP-004',
        supplier: 'Periph World',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[10]._id, quantity: 40, unitCost: 4200 },
          { product: products[11]._id, quantity: 30, unitCost: 2400 },
        ],
        status: 'done',
        notes: 'Peripherals bulk order',
        receivedDate: new Date(now - 5 * 3600000),
        receivedBy: admin._id,
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 4 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 3 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - DAY), details: 'Goods arrived' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 5 * 3600000), details: 'Receipt completed' },
        ],
        createdAt: new Date(now - 4 * DAY),
      },
      {
        receiptNumber: 'RCP-005',
        supplier: 'PackRight Solutions',
        warehouse: warehouses[3]._id,
        items: [
          { product: products[6]._id, quantity: 150, unitCost: 65 },
          { product: products[9]._id, quantity: 80, unitCost: 280 },
        ],
        status: 'done',
        notes: 'Packaging materials restock',
        receivedDate: new Date(now - 3 * 3600000),
        receivedBy: staff._id,
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 8 * 3600000), details: 'Goods arrived at dock' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 3 * 3600000), details: 'Receipt completed' },
        ],
        createdAt: new Date(now - 2 * DAY),
      },
      {
        receiptNumber: 'RCP-006',
        supplier: 'DisplayTech Ltd',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[8]._id, quantity: 15, unitCost: 24000 },
        ],
        status: 'done',
        notes: '4K monitors for design team',
        receivedDate: new Date(now - 6 * 3600000),
        receivedBy: admin._id,
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 3 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - DAY), details: 'Goods arrived' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 6 * 3600000), details: 'Receipt completed' },
        ],
        createdAt: new Date(now - 3 * DAY),
      },
      {
        receiptNumber: 'RCP-007',
        supplier: 'ToolMaster India',
        warehouse: warehouses[2]._id,
        items: [
          { product: products[7]._id, quantity: 60, unitCost: 800 },
        ],
        status: 'done',
        notes: 'Tool sets for warehouse ops',
        receivedDate: new Date(now - 7 * 3600000),
        receivedBy: staff._id,
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 12 * 3600000), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 9 * 3600000), details: 'Goods arrived' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 7 * 3600000), details: 'Receipt completed' },
        ],
        createdAt: new Date(now - DAY),
      },
      {
        receiptNumber: 'RCP-008',
        supplier: 'Hub Connect Ltd',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[3]._id, quantity: 100, unitCost: 1800 },
        ],
        status: 'done',
        notes: 'USB-C hub bulk order',
        receivedDate: new Date(now - 8 * 3600000),
        receivedBy: admin._id,
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 10 * 3600000), details: 'Goods arrived' },
          { action: 'done', user: admin._id, timestamp: new Date(now - 8 * 3600000), details: 'Receipt completed' },
        ],
        createdAt: new Date(now - 2 * DAY),
      },
      // === 12 PENDING (draft / waiting / ready) ===
      {
        receiptNumber: 'RCP-009',
        supplier: 'TechSupplies India Pvt Ltd',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[0]._id, quantity: 10, unitCost: 72000 },
          { product: products[8]._id, quantity: 8, unitCost: 24000 },
        ],
        status: 'waiting',
        notes: 'Laptop and monitor combo order',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - DAY), details: 'Receipt confirmed, waiting for goods' },
        ],
        createdAt: new Date(now - 2 * DAY),
      },
      {
        receiptNumber: 'RCP-010',
        supplier: 'Global Furniture Co.',
        warehouse: warehouses[2]._id,
        items: [
          { product: products[1]._id, quantity: 30, unitCost: 9500 },
        ],
        status: 'ready',
        notes: 'Office chairs for expansion',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 3 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 3600000), details: 'Goods arrived, ready to receive' },
        ],
        createdAt: new Date(now - 3 * DAY),
      },
      {
        receiptNumber: 'RCP-011',
        supplier: 'Periph World',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[2]._id, quantity: 80, unitCost: 3200 },
          { product: products[10]._id, quantity: 50, unitCost: 4200 },
        ],
        status: 'draft',
        notes: 'Mouse and keyboard combo draft',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 3600000), details: 'Receipt created as draft' },
        ],
        createdAt: new Date(now - 3600000),
      },
      {
        receiptNumber: 'RCP-012',
        supplier: 'CableNet India',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[5]._id, quantity: 100, unitCost: 12 },
        ],
        status: 'waiting',
        notes: 'Additional network cabling',
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 12 * 3600000), details: 'Receipt confirmed' },
        ],
        createdAt: new Date(now - DAY),
      },
      {
        receiptNumber: 'RCP-013',
        supplier: 'PackRight Solutions',
        warehouse: warehouses[3]._id,
        items: [
          { product: products[6]._id, quantity: 100, unitCost: 65 },
          { product: products[9]._id, quantity: 50, unitCost: 280 },
        ],
        status: 'ready',
        notes: 'Packaging supplies reorder',
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - 4 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 3 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 6 * 3600000), details: 'Goods arrived at dock' },
        ],
        createdAt: new Date(now - 4 * DAY),
      },
      {
        receiptNumber: 'RCP-014',
        supplier: 'DisplayTech Ltd',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[8]._id, quantity: 20, unitCost: 24000 },
        ],
        status: 'waiting',
        notes: 'Monitors for new hires',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 6 * 3600000), details: 'Receipt confirmed, waiting for delivery' },
        ],
        createdAt: new Date(now - DAY),
      },
      {
        receiptNumber: 'RCP-015',
        supplier: 'FastShip Logistics',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[3]._id, quantity: 60, unitCost: 1800 },
          { product: products[11]._id, quantity: 25, unitCost: 2400 },
        ],
        status: 'draft',
        notes: 'Accessories draft order',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 2 * 3600000), details: 'Receipt created as draft' },
        ],
        createdAt: new Date(now - 2 * 3600000),
      },
      {
        receiptNumber: 'RCP-016',
        supplier: 'ToolMaster India',
        warehouse: warehouses[2]._id,
        items: [
          { product: products[7]._id, quantity: 40, unitCost: 800 },
          { product: products[4]._id, quantity: 5, unitCost: 16000 },
        ],
        status: 'ready',
        notes: 'Tools and desk frames',
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - 5 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 4 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 2 * 3600000), details: 'Goods arrived' },
        ],
        createdAt: new Date(now - 5 * DAY),
      },
      {
        receiptNumber: 'RCP-017',
        supplier: 'Infra Supplies Co.',
        warehouse: warehouses[3]._id,
        items: [
          { product: products[5]._id, quantity: 50, unitCost: 12 },
        ],
        status: 'draft',
        notes: 'Small cable order draft',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 3600000), details: 'Receipt created as draft' },
        ],
        createdAt: new Date(now - 3600000),
      },
      {
        receiptNumber: 'RCP-018',
        supplier: 'Hub Connect Ltd',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[0]._id, quantity: 5, unitCost: 72000 },
          { product: products[2]._id, quantity: 20, unitCost: 3200 },
        ],
        status: 'waiting',
        notes: 'Executive laptop and mouse order',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 3 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt confirmed' },
        ],
        createdAt: new Date(now - 3 * DAY),
      },
      {
        receiptNumber: 'RCP-019',
        supplier: 'ElectroParts Global',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[10]._id, quantity: 35, unitCost: 4200 },
          { product: products[11]._id, quantity: 40, unitCost: 2400 },
        ],
        status: 'ready',
        notes: 'Peripherals for warehouse staff',
        createdBy: staff._id,
        activities: [
          { action: 'created', user: staff._id, timestamp: new Date(now - 6 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - 5 * DAY), details: 'Receipt confirmed' },
          { action: 'ready', user: staff._id, timestamp: new Date(now - 4 * 3600000), details: 'Goods arrived' },
        ],
        createdAt: new Date(now - 6 * DAY),
      },
      {
        receiptNumber: 'RCP-020',
        supplier: 'SafePack Industries',
        warehouse: warehouses[3]._id,
        items: [
          { product: products[6]._id, quantity: 120, unitCost: 65 },
          { product: products[9]._id, quantity: 50, unitCost: 280 },
        ],
        status: 'waiting',
        notes: 'Packing supplies for peak season',
        createdBy: admin._id,
        activities: [
          { action: 'created', user: admin._id, timestamp: new Date(now - 2 * DAY), details: 'Receipt created' },
          { action: 'confirmed', user: admin._id, timestamp: new Date(now - DAY), details: 'Receipt confirmed' },
        ],
        createdAt: new Date(now - 2 * DAY),
      },
    ]);
    console.log('Receipts created');

    // --- Delivery Orders ---
    await DeliveryOrder.create([
      {
        orderNumber: 'DEL-001',
        customer: 'Infosys Technologies',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[0]._id, quantity: 5, unitPrice: 89999 },
          { product: products[2]._id, quantity: 10, unitPrice: 4999 },
        ],
        status: 'delivered',
        priority: 'high',
        shippingAddress: 'Electronics City, Bangalore, Karnataka',
        deliveredDate: new Date(now - 3 * 86400000),
        createdBy: admin._id,
        createdAt: new Date(now - 7 * 86400000),
      },
      {
        orderNumber: 'DEL-002',
        customer: 'Wipro Ltd',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[10]._id, quantity: 20, unitPrice: 6999 },
          { product: products[11]._id, quantity: 20, unitPrice: 3999 },
        ],
        status: 'shipped',
        priority: 'normal',
        shippingAddress: 'Hinjewadi IT Park, Pune, Maharashtra',
        createdBy: admin._id,
        createdAt: new Date(now - 4 * 86400000),
      },
      {
        orderNumber: 'DEL-003',
        customer: 'TCS Mumbai Office',
        warehouse: warehouses[0]._id,
        items: [
          { product: products[8]._id, quantity: 10, unitPrice: 32999 },
        ],
        status: 'packing',
        priority: 'high',
        shippingAddress: 'Andheri East, Mumbai, Maharashtra',
        createdBy: staff._id,
        createdAt: new Date(now - 2 * 86400000),
      },
      {
        orderNumber: 'DEL-004',
        customer: 'Reliance Jio',
        warehouse: warehouses[2]._id,
        items: [
          { product: products[3]._id, quantity: 50, unitPrice: 3499 },
          { product: products[5]._id, quantity: 1000, unitPrice: 25 },
        ],
        status: 'picking',
        priority: 'normal',
        shippingAddress: 'Navi Mumbai, Maharashtra',
        createdBy: admin._id,
        createdAt: new Date(now - 86400000),
      },
      {
        orderNumber: 'DEL-005',
        customer: 'Zomato HQ',
        warehouse: warehouses[1]._id,
        items: [
          { product: products[4]._id, quantity: 8, unitPrice: 24999 },
          { product: products[1]._id, quantity: 8, unitPrice: 15999 },
        ],
        status: 'pending',
        priority: 'low',
        shippingAddress: 'Sector 135, Noida, UP',
        createdBy: staff._id,
        createdAt: new Date(),
      },
      {
        orderNumber: 'DEL-006',
        customer: 'Amazon India Warehouse',
        warehouse: warehouses[3]._id,
        items: [
          { product: products[6]._id, quantity: 200, unitPrice: 120 },
          { product: products[9]._id, quantity: 100, unitPrice: 450 },
        ],
        status: 'pending',
        priority: 'high',
        shippingAddress: 'Bhiwandi, Thane, Maharashtra',
        createdBy: admin._id,
        createdAt: new Date(),
      },
    ]);
    console.log('Delivery Orders created');

    console.log('\n=== SEED COMPLETE ===');
    console.log('Admin login: admin@coreinventory.com / admin123');
    console.log('Staff login: staff@coreinventory.com / admin123');
    console.log('Warehouses: 4 | Products: 12 | Receipts: 20 | Deliveries: 6');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();
