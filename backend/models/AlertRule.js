const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['low_stock', 'overstock', 'expiry', 'reorder_point'],
      required: true,
    },
    condition: {
      threshold: { type: Number, default: null },
      daysBeforeExpiry: { type: Number, default: null },
      productIds: [{ type: String }],
      categoryIds: [{ type: String }],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    notifyEmail: {
      type: Boolean,
      default: true,
    },
    notifyDashboard: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlertRule', alertRuleSchema);
