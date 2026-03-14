const mongoose = require('mongoose');

const adjustmentItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  systemQuantity: {
    type: Number,
    required: true
  },
  actualQuantity: {
    type: Number,
    required: true
  },
  difference: {
    type: Number,
    required: true
  }
});

const adjustmentSchema = new mongoose.Schema({
  adjustmentNumber: {
    type: String,
    unique: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [adjustmentItemSchema],
  reason: {
    type: String,
    required: [true, 'Adjustment reason is required'],
    enum: ['damage', 'theft', 'counting_error', 'expiry', 'quality_issue', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'applied', 'rejected'],
    default: 'draft'
  },
  notes: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

adjustmentSchema.pre('save', function(next) {
  if (!this.adjustmentNumber) {
    this.adjustmentNumber = 'ADJ-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('InventoryAdjustment', adjustmentSchema);
