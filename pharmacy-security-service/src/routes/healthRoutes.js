'use strict';

const express = require('express');
const { getHealth, getDbHealth } = require('../controllers/healthController');

const router = express.Router();

// GET /health - Basic service liveness/health probe
router.get('/', getHealth);

// GET /health/db - Database connectivity and readiness probe
router.get('/db', getDbHealth);

module.exports = router;
