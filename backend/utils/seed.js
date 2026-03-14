require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Warehouse.deleteMany({})
    ]);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@coreinventory.com',
      password: 'admin123',
      role: 'admin'
    });

    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@coreinventory.com',
      password: 'staff123',
      role: 'staff'
    });

    console.log('✅ Users created');

    // Create warehouses
    const warehouses = await Warehouse.create([
      { name: 'Main Warehouse', code: 'WH-MAIN', location: { address: '123 Industrial Ave', city: 'Mumbai', state: 'Maharashtra' }, capacity: 50000, manager: admin._id },
      { name: 'North Hub', code: 'WH-NORTH', location: { address: '456 Logistics Park', city: 'Delhi', state: 'Delhi' }, capacity: 30000, manager: staff._id },
      { name: 'South Center', code: 'WH-SOUTH', location: { address: '789 Trade Zone', city: 'Chennai', state: 'Tamil Nadu' }, capacity: 25000 }
    ]);

    console.log('✅ Warehouses created');

    // Create products
    const products = await Product.create([
      { name: 'Steel Rods (10mm)', sku: 'STL-ROD-10', category: 'Raw Materials', unit: 'kg', price: 85, costPrice: 65, stockQuantity: 2500, minStockLevel: 500, maxStockLevel: 10000, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Copper Wire Bundle', sku: 'COP-WIR-01', category: 'Raw Materials', unit: 'meters', price: 120, costPrice: 90, stockQuantity: 1800, minStockLevel: 300, maxStockLevel: 5000, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Office Chair - Ergonomic', sku: 'FUR-CHR-ERG', category: 'Furniture', unit: 'pcs', price: 8500, costPrice: 5200, stockQuantity: 45, minStockLevel: 10, maxStockLevel: 200, warehouse: warehouses[1]._id, createdBy: admin._id },
      { name: 'Standing Desk Pro', sku: 'FUR-DSK-PRO', category: 'Furniture', unit: 'pcs', price: 15000, costPrice: 9800, stockQuantity: 22, minStockLevel: 5, maxStockLevel: 100, warehouse: warehouses[1]._id, createdBy: admin._id },
      { name: 'LED Panel Light 40W', sku: 'ELC-LED-40W', category: 'Electronics', unit: 'pcs', price: 1200, costPrice: 750, stockQuantity: 320, minStockLevel: 50, maxStockLevel: 1000, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Smart Sensor Module', sku: 'ELC-SNS-MOD', category: 'Electronics', unit: 'pcs', price: 3500, costPrice: 2100, stockQuantity: 8, minStockLevel: 20, maxStockLevel: 500, warehouse: warehouses[2]._id, createdBy: admin._id },
      { name: 'Packaging Box (Large)', sku: 'PKG-BOX-LRG', category: 'Packaging', unit: 'boxes', price: 45, costPrice: 25, stockQuantity: 5000, minStockLevel: 1000, maxStockLevel: 20000, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Bubble Wrap Roll', sku: 'PKG-BWR-001', category: 'Packaging', unit: 'meters', price: 35, costPrice: 18, stockQuantity: 3200, minStockLevel: 500, maxStockLevel: 10000, warehouse: warehouses[0]._id, createdBy: admin._id },
      { name: 'Power Drill Machine', sku: 'TLS-DRL-001', category: 'Tools', unit: 'pcs', price: 4500, costPrice: 2800, stockQuantity: 15, minStockLevel: 5, maxStockLevel: 50, warehouse: warehouses[1]._id, createdBy: admin._id },
      { name: 'Industrial Gloves (Pack)', sku: 'CON-GLV-IND', category: 'Consumables', unit: 'boxes', price: 350, costPrice: 200, stockQuantity: 3, minStockLevel: 20, maxStockLevel: 200, warehouse: warehouses[2]._id, createdBy: admin._id },
      { name: 'Hydraulic Pump Spare', sku: 'SPR-HYD-PMP', category: 'Spare Parts', unit: 'pcs', price: 12000, costPrice: 8500, stockQuantity: 7, minStockLevel: 3, maxStockLevel: 30, warehouse: warehouses[2]._id, createdBy: admin._id },
      { name: 'Aluminum Sheet 2mm', sku: 'RAW-ALU-2MM', category: 'Raw Materials', unit: 'kg', price: 210, costPrice: 165, stockQuantity: 850, minStockLevel: 200, maxStockLevel: 3000, warehouse: warehouses[0]._id, createdBy: admin._id }
    ]);

    console.log('✅ Products created');
    console.log(`\n📊 Seed Summary:`);
    console.log(`   Users: 2 (admin@coreinventory.com / admin123)`);
    console.log(`   Warehouses: ${warehouses.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`\n🎉 Seeding complete!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
