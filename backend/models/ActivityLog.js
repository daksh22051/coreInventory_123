const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
    'product_created', 'product_updated', 'product_deleted',
    'receipt_created', 'receipt_validated', 'receipt_cancelled', 'receipt_completed', 'receipt_confirmed',
    'delivery_created', 'delivery_shipped', 'delivery_delivered', 'delivery_cancelled',
    'transfer_created', 'transfer_completed', 'transfer_cancelled',
    'adjustment_created', 'adjustment_applied',
    'user_login', 'user_signup', 'otp_requested',
    'warehouse_created', 'warehouse_updated', 'warehouse_deleted',
    'stock_low_alert', 'stock_adjusted'
  ]
  },
  entity: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
