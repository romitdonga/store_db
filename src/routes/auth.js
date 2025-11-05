const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Public routes
router.post('/login', authController.login);

// Protected routes - require authentication and owner role
router.post('/register', auth, rbac('OWNER'), authController.register);

module.exports = router;