const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, getCategories } = require('../controllers/productController');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);

module.exports = router;