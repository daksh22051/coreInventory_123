const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getReorderSuggestions, getLowStockProducts
} = require('../controllers/productController');

router.use(protect);

router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/reorder-suggestions', getReorderSuggestions);
router.get('/:id', getProduct);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], validate, createProduct);

router.put('/:id', updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
