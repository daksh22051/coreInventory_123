const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Furniture', 'Raw Materials', 'Packaging', 'Tools', 'Consumables', 'Spare Parts', 'Other']
  },
  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'liters', 'meters', 'boxes', 'pallets', 'units'],
    default: 'pcs'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    default: 1000
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  stockByLocation: [
    {
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
      },
      rack: {
        type: String,
        default: 'GENERAL',
      },
      quantity: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  ],
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  barcode: {
    type: String,
    default: '',
    index: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 'text', category: 'text' });

productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minStockLevel;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
