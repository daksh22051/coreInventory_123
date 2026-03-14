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
      'receipt_created', 'receipt_validated',
      'delivery_created', 'delivery_shipped', 'delivery_delivered',
      'transfer_created', 'transfer_completed',
      'adjustment_created', 'adjustment_applied',
      'user_login', 'user_signup',
      'warehouse_created', 'warehouse_updated',
      'stock_low_alert'
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

module.exports = mongoose.model('ActivityLog', activityLogSchema);
