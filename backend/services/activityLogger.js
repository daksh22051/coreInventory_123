const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, entity, entityId = null, details = '', metadata = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, entity, entityId, details, metadata });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

module.exports = { logActivity };
