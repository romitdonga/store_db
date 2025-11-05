const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Public routes (require authentication but any role)
router.get('/', auth, productController.listProducts);
router.get('/:id', auth, productController.getProductById);

// Protected routes - require authentication and owner role
router.post('/', auth, rbac('OWNER'), productController.createProduct);
router.put('/:id', auth, rbac('OWNER'), productController.updateProduct);
router.delete('/:id', auth, rbac('OWNER'), productController.deleteProduct);

module.exports = router;