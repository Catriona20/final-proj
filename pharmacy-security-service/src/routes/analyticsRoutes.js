'use strict';

const express = require('express');
const { logPrediction, submitFeedback, getMetrics } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Log an AI prediction (internal/service-to-service or authenticated user)
router.post('/symptoms/log', logPrediction);

// Submit user feedback on recommendation (patient, doctor, admin)
router.post('/symptoms/feedback', authenticate, submitFeedback);

// Model performance metrics (admin only)
router.get('/models/performance', authenticate, authorize('admin'), getMetrics);

module.exports = router;
