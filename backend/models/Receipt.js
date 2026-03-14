const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    default: 0
  }
});

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true
  },
  supplier: {
    type: String,
    required: [true, 'Supplier name is required']
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [receiptItemSchema],
  // Odoo-style workflow: draft → waiting → ready → done → cancelled
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String,
    default: ''
  },
  totalCost: {
    type: Number,
    default: 0
  },
  expectedDate: {
    type: Date
  },
  receivedDate: {
    type: Date
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activities: [activitySchema]
}, { timestamps: true });

receiptSchema.pre('save', function(next) {
  if (!this.receiptNumber) {
    this.receiptNumber = 'RCP-' + Date.now().toString(36).toUpperCase();
  }
  // Calculate total cost
  this.totalCost = this.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  next();
});

// Virtual for total quantity
receiptSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

receiptSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Receipt', receiptSchema);
