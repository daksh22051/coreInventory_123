const Notification = require('../models/Notification');

const createNotification = async (io, { userId, type, title, message, severity = 'info', entityType = '', entityId = null, metadata = {} }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      severity,
      entityType,
      entityId,
      metadata,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Push via socket
    if (io) {
      io.emit('notification:new', notification);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

const broadcastToAll = async (io, { type, title, message, severity = 'info', entityType = '', entityId = null, metadata = {} }) => {
  const User = require('../models/User');
  try {
    const users = await User.find({ isActive: true }).select('_id');
    const notifications = await Promise.all(
      users.map(u => createNotification(io, { userId: u._id, type, title, message, severity, entityType, entityId, metadata }))
    );
    return notifications;
  } catch (error) {
    console.error('Failed to broadcast notifications:', error.message);
  }
};

module.exports = { createNotification, broadcastToAll };
