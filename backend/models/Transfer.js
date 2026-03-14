const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    unique: true
  },
  fromWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [transferItemSchema],
  status: {
    type: String,
    enum: ['draft', 'in_transit', 'completed', 'cancelled'],
    default: 'draft'
  },
  reason: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  completedDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

transferSchema.pre('save', function(next) {
  if (!this.transferNumber) {
    this.transferNumber = 'TRF-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transfer', transferSchema);
