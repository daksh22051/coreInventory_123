const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
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
  unitPrice: {
    type: Number,
    default: 0
  }
});

const deliveryOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: String,
    required: [true, 'Customer name is required']
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [deliveryItemSchema],
  status: {
    type: String,
    enum: ['pending', 'picking', 'packing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  notes: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  shippingAddress: {
    type: String,
    default: ''
  },
  expectedDate: {
    type: Date
  },
  deliveredDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

deliveryOrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'DEL-' + Date.now().toString(36).toUpperCase();
  }
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  next();
});

module.exports = mongoose.model('DeliveryOrder', deliveryOrderSchema);
