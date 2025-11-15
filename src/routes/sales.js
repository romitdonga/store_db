const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// All sales routes require authentication
router.get('/', auth, salesController.listSales);
router.get('/search/phone', auth, salesController.searchCustomersByPhonePrefix);
router.get('/:id', auth, salesController.getSaleById);
router.post('/', auth, salesController.createSale);

module.exports = router;