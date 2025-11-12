const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refresh); // ✅ NEW: Refresh token endpoint

// Protected routes - require authentication and owner role
router.post('/register', auth, rbac('OWNER'), authController.register);
router.post('/logout', auth, authController.logout); // ✅ NEW: Logout endpoint

module.exports = router;