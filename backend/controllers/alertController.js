const AlertRule = require('../models/AlertRule');
const AlertAcknowledgement = require('../models/AlertAcknowledgement');
const { isInMemoryMode } = require('../config/db');

const memoryRules = [];
const memoryAcks = [];

function getUserId(req) {
  return String(req.user?._id || req.user?.id || 'demo-user-001');
}

exports.getRules = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (isInMemoryMode()) {
      const rows = memoryRules.filter((r) => r.user === userId);
      return res.json({ success: true, data: rows });
    }

    const rows = await AlertRule.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRule = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      name,
      type,
      condition = {},
      enabled = true,
      notifyEmail = true,
      notifyDashboard = true,
    } = req.body; M

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'name and type are required' });
    }

    if (isInMemoryMode()) {
      const row = {
        id: `rule-${Date.now()}`,
        user: userId,
        name: String(name).trim(),
        type,
        condition,
        enabled: Boolean(enabled),
        notifyEmail: Boolean(notifyEmail),
        notifyDashboard: Boolean(notifyDashboard),
        createdAt: new Date().toISOString(),
      };
      memoryRules.unshift(row);
      return res.status(201).json({ success: true, data: row });
    }

    const row = await AlertRule.create({
      user: userId,
      name: String(name).trim(),
      type,
      condition,
      enabled: Boolean(enabled),
      notifyEmail: Boolean(notifyEmail),
      notifyDashboard: Boolean(notifyDashboard),
    });

    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (isInMemoryMode()) {
      const idx = memoryRules.findIndex((r) => r.id === id && r.user === userId);
      if (idx < 0) {
        return res.status(404).json({ success: false, message: 'Rule not found' });
      }
      memoryRules[idx] = { ...memoryRules[idx], ...req.body };
      return res.json({ success: true, data: memoryRules[idx] });
    }

    const row = await AlertRule.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: req.body },
      { new: true }
    );

    if (!row) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (isInMemoryMode()) {
      const idx = memoryRules.findIndex((r) => r.id === id && r.user === userId);
      if (idx < 0) {
        return res.status(404).json({ success: false, message: 'Rule not found' });
      }
      memoryRules.splice(idx, 1);
      return res.json({ success: true, message: 'Rule deleted' });
    }

    const row = await AlertRule.findOneAndDelete({ _id: id, user: userId });
    if (!row) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    return res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAcknowledgements = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (isInMemoryMode()) {
      const rows = memoryAcks.filter((a) => a.user === userId);
      return res.json({ success: true, data: rows });
    }

    const rows = await AlertAcknowledgement.find({ user: userId }).sort({ acknowledgedAt: -1 }).lean();
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { alertId } = req.body;

    if (!alertId) {
      return res.status(400).json({ success: false, message: 'alertId is required' });
    }

    if (isInMemoryMode()) {
      const existing = memoryAcks.find((a) => a.user === userId && a.alertId === alertId);
      if (existing) {
        return res.json({ success: true, data: existing });
      }

      const row = {
        id: `ack-${Date.now()}`,
        user: userId,
        alertId,
        acknowledgedAt: new Date().toISOString(),
      };
      memoryAcks.unshift(row);
      return res.status(201).json({ success: true, data: row });
    }

    const row = await AlertAcknowledgement.findOneAndUpdate(
      { user: userId, alertId },
      { $set: { acknowledgedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
