const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// All report routes require authentication and owner role
router.get('/dashboard', auth, rbac('OWNER'), reportController.getDashboardStats);
router.get('/sales', auth, rbac('OWNER'), reportController.getSalesReport);
router.get('/top-products', auth, rbac('OWNER'), reportController.getTopProducts);
router.get('/low-stock', auth, rbac('OWNER'), reportController.getLowStockProducts);

module.exports = router;