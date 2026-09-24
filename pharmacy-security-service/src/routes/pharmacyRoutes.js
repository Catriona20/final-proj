'use strict';

const express = require('express');
const {
  getMedicines,
  getInventory,
  getLowStockAlerts,
  getExpiringAlerts,
  dispense,
  analyzeInventory,
  updateInventoryPolicy,
} = require('../controllers/pharmacyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Medicine catalog (accessible to authenticated users: patient, doctor, admin)
router.get('/medicines', authenticate, getMedicines);

// Inventory policy management (Admin strictly)
router.patch('/medicines/:medicine_id/inventory-policy', authenticate, authorize('admin'), updateInventoryPolicy);

// Inventory batch status (doctor and admin)
router.get('/inventory', authenticate, authorize('doctor', 'admin'), getInventory);

// Inventory alerts (doctor and admin)
router.get('/alerts/low-stock', authenticate, authorize('doctor', 'admin'), getLowStockAlerts);
router.get('/alerts/expiring', authenticate, authorize('doctor', 'admin'), getExpiringAlerts);

// Dispense medicine from inventory (doctor and admin)
router.post('/dispense', authenticate, authorize('doctor', 'admin'), dispense);

// Database-backed inventory intelligence & demand forecast analysis (doctor and admin)
router.post('/inventory/analyze', authenticate, authorize('doctor', 'admin'), analyzeInventory);

module.exports = router;
