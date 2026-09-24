'use strict';

const express = require('express');
const { register, login, getMe, getAuditLogs } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

// Protected user context (all authenticated roles)
router.get('/me', authenticate, getMe);

// Protected audit trail (admin only)
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);

module.exports = router;
