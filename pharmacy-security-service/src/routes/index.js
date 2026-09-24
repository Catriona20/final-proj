'use strict';

const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const pharmacyRoutes = require('./pharmacyRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

// Health check probes
router.use('/health', healthRoutes);
router.use('/api/health', healthRoutes);

// Modular API routes
router.use('/api/auth', authRoutes);
router.use('/api/pharmacy', pharmacyRoutes);
router.use('/api/analytics', analyticsRoutes);

module.exports = router;
