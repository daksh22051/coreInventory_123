const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected',
    },
    lastSync: {
      type: Date,
      default: null,
    },
    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

integrationSchema.index({ id: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
