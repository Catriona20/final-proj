'use strict';

const pharmacyService = require('../services/pharmacyService');

/**
 * Controller for pharmacy inventory, stock alerts, and dispensing (Module 11).
 */

const getMedicines = async (req, res, next) => {
  try {
    const medicines = await pharmacyService.getMedicines();
    return res.status(200).json({
      count: medicines.length,
      medicines,
    });
  } catch (error) {
    next(error);
  }
};

const getInventory = async (req, res, next) => {
  try {
    const inventory = await pharmacyService.getInventory();
    return res.status(200).json({
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockAlerts = async (req, res, next) => {
  try {
    const alerts = await pharmacyService.getLowStockAlerts();
    return res.status(200).json({
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

const getExpiringAlerts = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '90', 10);
    const alerts = await pharmacyService.getExpiringAlerts(days);
    return res.status(200).json({
      thresholdDays: days,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

const dispense = async (req, res, next) => {
  try {
    const { prescriptionId, inventoryId, quantity, notes } = req.body;

    if (!inventoryId || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'inventoryId and a valid positive quantity are required.',
      });
    }

    const result = await pharmacyService.dispenseMedicine(
      {
        prescriptionId: prescriptionId || null,
        inventoryId,
        dispensedBy: req.user.id,
        quantity: parseInt(quantity, 10),
        notes,
      },
      req.ip
    );

    return res.status(201).json({
      message: 'Medicine dispensed successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const analyzeInventory = async (req, res, next) => {
  try {
    const {
      medicine_id,
      horizon_days = 14,
      current_stock,
      lead_time_days,
      safety_stock,
      reorder_point,
      history,
    } = req.body;

    if (!medicine_id) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'medicine_id (SKU or UUID) is required.',
      });
    }

    const result = await pharmacyService.analyzeInventoryWithDatabase({
      medicineId: medicine_id,
      horizonDays: parseInt(horizon_days, 10) || 14,
      currentStockOverride: current_stock,
      leadTimeDaysOverride: lead_time_days,
      safetyStockOverride: safety_stock,
      reorderPointOverride: reorder_point,
      historyOverride: history,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateInventoryPolicy = async (req, res, next) => {
  try {
    const { medicine_id } = req.params;
    const { reorder_threshold, safety_stock, supplier_lead_time_days } = req.body;

    const updated = await pharmacyService.updateMedicineInventoryPolicy(
      medicine_id,
      { reorder_threshold, safety_stock, supplier_lead_time_days },
      req.user.id,
      req.ip
    );

    return res.status(200).json({
      message: 'Inventory policy updated successfully.',
      medicine: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicines,
  getInventory,
  getLowStockAlerts,
  getExpiringAlerts,
  dispense,
  analyzeInventory,
  updateInventoryPolicy,
};
