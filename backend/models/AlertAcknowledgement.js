const mongoose = require('mongoose');

const alertAcknowledgementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alertId: {
      type: String,
      required: true,
      trim: true,
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

alertAcknowledgementSchema.index({ user: 1, alertId: 1 }, { unique: true });

module.exports = mongoose.model('AlertAcknowledgement', alertAcknowledgementSchema);
