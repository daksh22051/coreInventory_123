const Integration = require('../models/Integration');
const { isInMemoryMode } = require('../config/db');

const memoryStore = [];

const getUserId = (req) => String(req.user?._id || req.user?.id || 'demo-user-001');

const defaultDescription = {
  shopify: 'Sync products, orders, and inventory with your Shopify store',
  woocommerce: 'Connect your WordPress WooCommerce store',
  quickbooks: 'Sync invoices, expenses, and financial data',
  amazon: 'Manage Amazon marketplace inventory and orders',
  zapier: 'Connect to 5000+ apps via Zapier automation',
  api: 'Use our REST API for custom integrations',
};

exports.getIntegrations = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (isInMemoryMode()) {
      const rows = memoryStore.filter((row) => row.user === userId);
      return res.json({ success: true, data: rows });
    }

    const rows = await Integration.find({ user: userId }).lean();
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.connectIntegration = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (isInMemoryMode()) {
      const idx = memoryStore.findIndex((row) => row.user === userId && row.id === id);
      const next = {
        id,
        name: id,
        description: defaultDescription[id] || 'Integration',
        status: 'connected',
        lastSync: new Date().toISOString(),
        credentials: {},
        isCustom: false,
        user: userId,
      };
      if (idx >= 0) {
        memoryStore[idx] = { ...memoryStore[idx], ...next };
      } else {
        memoryStore.push(next);
      }
      return res.json({ success: true, data: next });
    }

    const row = await Integration.findOneAndUpdate(
      { id, user: userId },
      {
        $set: {
          name: id,
          description: defaultDescription[id] || 'Integration',
          status: 'connected',
          lastSync: new Date(),
          isCustom: false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.disconnectIntegration = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (isInMemoryMode()) {
      const idx = memoryStore.findIndex((row) => row.user === userId && row.id === id);
      if (idx >= 0) {
        memoryStore[idx] = {
          ...memoryStore[idx],
          status: 'disconnected',
          credentials: {},
          lastSync: null,
        };
      }
      return res.json({ success: true });
    }

    await Integration.findOneAndUpdate(
      { id, user: userId },
      { $set: { status: 'disconnected', credentials: {}, lastSync: null } },
      { new: true }
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.configureIntegration = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { credentials = {} } = req.body;

    if (isInMemoryMode()) {
      const idx = memoryStore.findIndex((row) => row.user === userId && row.id === id);
      const next = {
        id,
        name: id,
        description: defaultDescription[id] || 'Integration',
        status: 'connected',
        lastSync: new Date().toISOString(),
        credentials,
        isCustom: false,
        user: userId,
      };
      if (idx >= 0) {
        memoryStore[idx] = { ...memoryStore[idx], ...next };
      } else {
        memoryStore.push(next);
      }
      return res.json({ success: true, data: next });
    }

    const row = await Integration.findOneAndUpdate(
      { id, user: userId },
      {
        $set: {
          name: id,
          description: defaultDescription[id] || 'Integration',
          status: 'connected',
          credentials,
          lastSync: new Date(),
          isCustom: false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomIntegration = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, webhookUrl, apiKey, description = '' } = req.body;

    if (!name || !webhookUrl || !apiKey) {
      return res.status(400).json({ success: false, message: 'name, webhookUrl and apiKey are required' });
    }

    const customId = `custom-${Date.now()}`;
    const record = {
      id: customId,
      name: String(name).trim(),
      description: String(description).trim() || 'Custom integration',
      status: 'connected',
      lastSync: new Date().toISOString(),
      credentials: { webhookUrl, apiKey },
      isCustom: true,
      user: userId,
    };

    if (isInMemoryMode()) {
      memoryStore.push(record);
      return res.status(201).json({ success: true, data: record });
    }

    const row = await Integration.create({
      ...record,
      user: userId,
      lastSync: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        lastSync: row.lastSync,
        credentials: row.credentials,
        isCustom: row.isCustom,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
