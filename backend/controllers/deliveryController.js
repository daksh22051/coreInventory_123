const DeliveryOrder = require('../models/DeliveryOrder');
const Product = require('../models/Product');
const { logActivity } = require('../services/activityLogger');
const { isInMemoryMode } = require('../config/db');
const { applyDeltaByLocation, ensureInitialLocationStock } = require('../utils/stockByLocation');

let DEMO_DELIVERY_ORDERS = [
  {
    _id: 'demo-delivery-1',
    orderId: 'ORD-DEMO-001',
    customer: 'Demo Customer',
    address: '123 Demo Street, City',
    priority: 'normal',
    items: [
      { productId: 'demo-product-1', quantity: 5 },
    ],
    totalItems: 1,
    totalUnits: 5,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-delivery-2',
    orderId: 'ORD-DEMO-002',
    customer: 'Acme Industries',
    address: '456 Market Road, City',
    priority: 'high',
    items: [
      { productId: 'demo-product-2', quantity: 12 },
      { productId: 'demo-product-3', quantity: 3 },
    ],
    totalItems: 2,
    totalUnits: 15,
    status: 'picking',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'demo-delivery-3',
    orderId: 'ORD-DEMO-003',
    customer: 'Globex Corp',
    address: '789 Industrial Blvd, City',
    priority: 'low',
    items: [
      { productId: 'demo-product-4', quantity: 8 },
    ],
    totalItems: 1,
    totalUnits: 8,
    status: 'shipped',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-delivery-4',
    orderId: 'ORD-DEMO-004',
    customer: 'Northwind Traders',
    address: '22 Sunset Ave, City',
    priority: 'normal',
    items: [
      { productId: 'demo-product-5', quantity: 20 },
    ],
    totalItems: 1,
    totalUnits: 20,
    status: 'delivered',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

exports.getDeliveries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const total = await DeliveryOrder.countDocuments(query);
    const deliveries = await DeliveryOrder.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: deliveries, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy delivery-orders API (public-style payload)
exports.getDeliveryOrdersLegacy = async (req, res) => {
  try {
    const { status = 'all', warehouse = 'all', limit } = req.query;

    if (isInMemoryMode()) {
      let data = [...DEMO_DELIVERY_ORDERS];
      if (status && status !== 'all') {
        data = data.filter((order) => String(order.status) === String(status));
      }
      if (limit) {
        const parsedLimit = Number(limit);
        if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
          data = data.slice(0, parsedLimit);
        }
      }
      return res.json({ success: true, data });
    }

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (warehouse && warehouse !== 'all') query.warehouse = warehouse;

    let ordersQuery = DeliveryOrder.find(query)
      .populate('items.product', 'name sku')
      .sort('-createdAt');

    if (limit) {
      const parsedLimit = Number(limit);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        ordersQuery = ordersQuery.limit(parsedLimit);
      }
    }

    const orders = await ordersQuery;

    // Return demo data if database is empty (fresh install)
    if (orders.length === 0) {
      return res.json({ success: true, data: DEMO_DELIVERY_ORDERS });
    }

    const data = orders.map((order) => {
      const totalUnits = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalItems = order.items.length;
      return {
        _id: order._id,
        orderId: order.orderNumber,
        customer: order.customer,
        address: order.shippingAddress || '',
        priority: order.priority,
        items: order.items.map((item) => ({
          productId: item.product?._id || item.product,
          product: item.product
            ? {
              _id: item.product._id,
              name: item.product.name,
              sku: item.product.sku,
            }
            : null,
          quantity: item.quantity,
        })),
        totalItems,
        totalUnits,
        status: order.status,
        createdAt: order.createdAt,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    // Fallback to demo data on error
    res.json({ success: true, data: DEMO_DELIVERY_ORDERS });
  }
};

exports.getDeliveryStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pending,
      inProgress,
      shippedToday,
      delivered,
    ] = await Promise.all([
      DeliveryOrder.countDocuments({ status: 'pending' }),
      DeliveryOrder.countDocuments({ status: { $in: ['picking', 'packing'] } }),
      DeliveryOrder.countDocuments({ status: 'shipped', updatedAt: { $gte: today, $lt: tomorrow } }),
      DeliveryOrder.countDocuments({ status: 'delivered' }),
    ]);

    res.json({
      success: true,
      data: {
        pending,
        inProgress,
        shippedToday,
        delivered,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDelivery = async (req, res) => {
  try {
    const { customer, address, priority, products, quantity, status } = req.body;

    if (!customer || !address || !priority) {
      return res.status(400).json({ success: false, message: 'Customer, address, and priority are required' });
    }

    const productsArray = Array.isArray(products) ? products : (products ? [products] : []);
    const quantitiesArray = Array.isArray(quantity) ? quantity : (quantity ? [quantity] : []);

    if (productsArray.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product is required' });
    }

    if (productsArray.length !== quantitiesArray.length) {
      return res.status(400).json({ success: false, message: 'Products and quantities length mismatch' });
    }

    const items = productsArray.map((productId, index) => ({
      product: productId,
      quantity: Number(quantitiesArray[index] || 0),
    }));

    if (items.some((item) => !item.product || item.quantity <= 0)) {
      return res.status(400).json({ success: false, message: 'Each product must have a quantity greater than 0' });
    }

    const productDocs = await Product.find({ _id: { $in: items.map((item) => item.product) } }).select('warehouse price');
    if (productDocs.length !== items.length) {
      return res.status(400).json({ success: false, message: 'One or more selected products are invalid' });
    }

    const warehouseIds = [...new Set(productDocs.map((p) => p.warehouse?.toString()).filter(Boolean))];
    if (warehouseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected products are missing warehouse assignment' });
    }
    if (warehouseIds.length > 1) {
      return res.status(400).json({ success: false, message: 'All delivery items must belong to the same warehouse' });
    }

    const priceById = new Map(productDocs.map((p) => [p._id.toString(), Number(p.price || 0)]));
    const itemsWithPrice = items.map((item) => ({
      ...item,
      unitPrice: priceById.get(item.product.toString()) || 0,
    }));

    req.body.createdBy = req.user._id;
    const delivery = await DeliveryOrder.create({
      customer,
      warehouse: warehouseIds[0],
      shippingAddress: address,
      priority,
      items: itemsWithPrice,
      status: status || 'pending',
    });

    await logActivity(req.user._id, 'delivery_created', 'DeliveryOrder', delivery._id,
      `Delivery ${delivery.orderNumber} created for ${delivery.customer}`);

    if (req.io) {
      req.io.emit('delivery_update', { action: 'created', delivery });
      req.io.emit('delivery:created', { deliveryId: delivery._id, reference: delivery.orderNumber });
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy delivery-orders API (public-style payload)
exports.createDeliveryOrderLegacy = async (req, res) => {
  try {
    const { customer, address, priority, items, status } = req.body;

    if (!customer || !address) {
      return res.status(400).json({ success: false, message: 'Customer and address are required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const mappedItems = items.map((item) => ({
      product: item.productId,
      quantity: Number(item.quantity || 0),
    }));

    if (mappedItems.some((item) => !item.product || item.quantity <= 0)) {
      return res.status(400).json({ success: false, message: 'Each item needs a productId and quantity' });
    }

    const productDocs = await Product.find({ _id: { $in: mappedItems.map((item) => item.product) } }).select('warehouse price');
    if (productDocs.length !== mappedItems.length) {
      return res.status(400).json({ success: false, message: 'One or more selected products are invalid' });
    }

    const warehouseIds = [...new Set(productDocs.map((p) => p.warehouse?.toString()).filter(Boolean))];
    if (warehouseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected products are missing warehouse assignment' });
    }
    if (warehouseIds.length > 1) {
      return res.status(400).json({ success: false, message: 'All delivery items must belong to the same warehouse' });
    }

    const priceById = new Map(productDocs.map((p) => [p._id.toString(), Number(p.price || 0)]));
    const mappedItemsWithPrice = mappedItems.map((item) => ({
      ...item,
      unitPrice: priceById.get(item.product.toString()) || 0,
    }));

    if (isInMemoryMode()) {
      const totalUnits = mappedItemsWithPrice.reduce((sum, item) => sum + item.quantity, 0);
      const demo = {
        _id: 'demo-' + Date.now(),
        orderId: 'ORD-' + Date.now().toString(36).toUpperCase(),
        customer,
        address,
        priority: priority || 'normal',
        warehouse: warehouseIds[0],
        items: mappedItemsWithPrice.map((item) => ({ productId: item.product, quantity: item.quantity })),
        totalItems: mappedItems.length,
        totalUnits,
        status: status || 'pending',
        createdAt: new Date().toISOString(),
      };
      DEMO_DELIVERY_ORDERS.unshift(demo);
      if (req.io) {
        req.io.emit('delivery_update', { action: 'created', delivery: demo });
        req.io.emit('notification:new', { type: 'delivery_created', deliveryId: demo._id, reference: demo.orderId });
        req.io.emit('dashboard:refresh', { timestamp: new Date() });
      }
      return res.status(201).json({ success: true, data: demo });
    }

    const delivery = await DeliveryOrder.create({
      customer,
      warehouse: warehouseIds[0],
      shippingAddress: address,
      priority: priority || 'normal',
      items: mappedItemsWithPrice,
      status: status || 'pending',
    });

    if (req.io) {
      req.io.emit('delivery_update', { action: 'created', delivery });
      req.io.emit('notification:new', { type: 'delivery_created', deliveryId: delivery._id, reference: delivery.orderNumber });
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDeliveryOrderLegacy = async (req, res) => {
  try {
    if (!isInMemoryMode()) {
      return res.status(401).json({ success: false, message: 'Authentication required for status updates' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const idx = DEMO_DELIVERY_ORDERS.findIndex((order) => order._id === req.params.id || order.orderId === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    DEMO_DELIVERY_ORDERS[idx] = {
      ...DEMO_DELIVERY_ORDERS[idx],
      status,
    };

    return res.json({ success: true, data: DEMO_DELIVERY_ORDERS[idx] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // When shipped or delivered, decrease stock once
    if (['shipped', 'delivered'].includes(status) && !['shipped', 'delivered'].includes(delivery.status)) {
      for (const item of delivery.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ success: false, message: 'Delivery contains an invalid product' });
        }

        ensureInitialLocationStock(product);

        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Required: ${item.quantity}`
          });
        }

        const locationResult = applyDeltaByLocation(product, {
          warehouseId: delivery.warehouse,
          quantityDelta: -Number(item.quantity || 0),
        });

        if (!locationResult.success) {
          return res.status(400).json({
            success: false,
            message: `${locationResult.message} (${product.name})`,
          });
        }

        await product.save();
      }

      await logActivity(req.user._id, 'delivery_shipped', 'DeliveryOrder', delivery._id,
        `Delivery ${delivery.orderNumber} shipped/delivered - stock decreased`);
    }

    if (status === 'delivered') {
      delivery.deliveredDate = new Date();
      await logActivity(req.user._id, 'delivery_delivered', 'DeliveryOrder', delivery._id,
        `Delivery ${delivery.orderNumber} delivered`);
    }

    delivery.status = status;
    await delivery.save();

    if (req.io) {
      req.io.emit('stock_update', { action: 'delivery_update', delivery });
      req.io.emit('dashboard:refresh', { timestamp: new Date() });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
