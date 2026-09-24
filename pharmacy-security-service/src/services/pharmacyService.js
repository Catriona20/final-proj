'use strict';

const { query, pool } = require('../config/database');
const { logAuditEvent } = require('../utils/auditLogger');
const { triggerNotificationEvent } = require('./notificationClient');

/**
 * Pharmacy Inventory & Dispensing Service (Module 11)
 */

/**
 * Retrieves the catalog of medicines.
 */
const getMedicines = async () => {
  const { rows } = await query(`
    SELECT id, sku, name, generic_name, manufacturer, category, unit_price,
           reorder_threshold, is_prescription_required, created_at
    FROM medicines
    ORDER BY name ASC
  `);
  return rows;
};

/**
 * Retrieves batch-level inventory.
 */
const getInventory = async () => {
  const { rows } = await query(`
    SELECT i.id, i.medicine_id, m.name as medicine_name, m.sku,
           i.batch_number, i.quantity, i.expiry_date, i.location_bin, i.updated_at
    FROM inventory i
    JOIN medicines m ON i.medicine_id = m.id
    ORDER BY i.expiry_date ASC
  `);
  return rows;
};

/**
 * Identifies medicines where total stock across batches is below reorder threshold.
 */
const getLowStockAlerts = async () => {
  const { rows } = await query(`
    SELECT m.id as medicine_id, m.sku, m.name, m.reorder_threshold,
           COALESCE(SUM(i.quantity), 0)::INTEGER as current_stock,
           CASE
             WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'OUT_OF_STOCK'
             ELSE 'LOW_STOCK'
           END as status
    FROM medicines m
    LEFT JOIN inventory i ON m.id = i.medicine_id
    GROUP BY m.id, m.sku, m.name, m.reorder_threshold
    HAVING COALESCE(SUM(i.quantity), 0) <= m.reorder_threshold
    ORDER BY current_stock ASC
  `);
  return rows;
};

/**
 * Identifies inventory batches nearing expiration (within specified days).
 *
 * @param {number} [daysThreshold=90]
 */
const getExpiringAlerts = async (daysThreshold = 90) => {
  const { rows } = await query(`
    SELECT i.id as inventory_id, i.batch_number, i.quantity, i.expiry_date,
           i.location_bin, m.id as medicine_id, m.name as medicine_name, m.sku,
           (i.expiry_date - CURRENT_DATE) as days_until_expiry
    FROM inventory i
    JOIN medicines m ON i.medicine_id = m.id
    WHERE i.expiry_date <= CURRENT_DATE + (INTERVAL '1 day' * $1)
      AND i.quantity > 0
    ORDER BY i.expiry_date ASC
  `, [daysThreshold]);
  return rows;
};

/**
 * Dispenses medicine from a specific inventory batch.
 * Executes within a database transaction and logs audit + triggers low stock notification if needed.
 *
 * @param {Object} params
 * @param {string} [params.prescriptionId]
 * @param {string} params.inventoryId
 * @param {string} params.dispensedBy - User ID of doctor/admin
 * @param {number} params.quantity
 * @param {string} [params.notes]
 * @param {string} [ipAddress]
 */
const dispenseMedicine = async (
  { prescriptionId = null, inventoryId, dispensedBy, quantity, notes = '' },
  ipAddress = null
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock and verify inventory batch
    const invRes = await client.query(
      'SELECT id, medicine_id, batch_number, quantity FROM inventory WHERE id = $1 FOR UPDATE',
      [inventoryId]
    );

    if (invRes.rows.length === 0) {
      const err = new Error('Inventory batch not found.');
      err.statusCode = 404;
      throw err;
    }

    const batch = invRes.rows[0];
    if (batch.quantity < quantity) {
      const err = new Error(`Insufficient stock in batch ${batch.batch_number}. Available: ${batch.quantity}, Requested: ${quantity}`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Deduct inventory
    const updatedQty = batch.quantity - quantity;
    await client.query(
      'UPDATE inventory SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [updatedQty, inventoryId]
    );

    // 3. Record dispensation
    const dispRes = await client.query(`
      INSERT INTO dispensations (prescription_id, inventory_id, dispensed_by, quantity_dispensed, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, prescription_id, inventory_id, dispensed_by, quantity_dispensed, notes, dispensed_at
    `, [prescriptionId, inventoryId, dispensedBy, quantity, notes]);

    const dispensation = dispRes.rows[0];

    // 4. Update prescription status if full course dispensed
    if (prescriptionId) {
      await client.query(
        "UPDATE prescriptions SET status = 'dispensed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [prescriptionId]
      );
    }

    await client.query('COMMIT');

    // 5. Audit log
    await logAuditEvent({
      userId: dispensedBy,
      action: 'DISPENSE_MEDICINE',
      resourceType: 'dispensation',
      resourceId: dispensation.id,
      details: {
        inventoryId,
        medicineId: batch.medicine_id,
        quantity,
        remainingBatchStock: updatedQty,
      },
      ipAddress,
    });

    // 6. Check if stock is below threshold and dispatch notification event (boundary call)
    const stockRes = await query(
      'SELECT COALESCE(SUM(quantity), 0)::INTEGER as total, m.name, m.reorder_threshold FROM inventory i JOIN medicines m ON i.medicine_id = m.id WHERE m.id = $1 GROUP BY m.name, m.reorder_threshold',
      [batch.medicine_id]
    );
    if (stockRes.rows.length > 0 && stockRes.rows[0].total <= stockRes.rows[0].reorder_threshold) {
      await triggerNotificationEvent({
        eventType: 'LOW_STOCK_ALERT',
        recipient: 'pharmacy-alerts@medsecure.local',
        channel: 'email',
        template: 'LOW_STOCK',
        data: {
          medicineName: stockRes.rows[0].name,
          currentStock: stockRes.rows[0].total,
          reorderThreshold: stockRes.rows[0].reorder_threshold,
        },
      });
    }

    return {
      dispensation,
      remainingBatchStock: updatedQty,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Retrieves single medicine by SKU or UUID.
 * @param {string} sku
 */
const getMedicineBySku = async (sku) => {
  const { rows } = await query(`
    SELECT id, sku, name, generic_name, manufacturer, category, unit_price,
           reorder_threshold, safety_stock, supplier_lead_time_days, is_prescription_required, created_at, updated_at
    FROM medicines
    WHERE sku = $1 OR id::text = $1
    LIMIT 1
  `, [sku]);
  return rows[0] || null;
};

/**
 * Aggregates non-expired stock across all batches for a given medicine.
 * @param {string} medicineId
 */
const getAggregateStock = async (medicineId) => {
  const { rows } = await query(`
    SELECT COALESCE(SUM(quantity), 0)::INTEGER as current_stock
    FROM inventory
    WHERE medicine_id = $1 AND expiry_date >= CURRENT_DATE
  `, [medicineId]);
  return rows.length > 0 ? rows[0].current_stock : 0;
};

/**
 * Retrieves daily aggregated historical demand for a medicine over past N days.
 * @param {string} medicineId
 * @param {number} [days=35]
 */
const getHistoricalDemand = async (medicineId, days = 35) => {
  const { rows } = await query(`
    SELECT DATE(d.dispensed_at)::text as date,
           COALESCE(SUM(d.quantity_dispensed), 0)::NUMERIC as quantity_dispensed
    FROM dispensations d
    JOIN inventory i ON d.inventory_id = i.id
    WHERE i.medicine_id = $1 AND d.dispensed_at >= CURRENT_DATE - (INTERVAL '1 day' * $2)
    GROUP BY DATE(d.dispensed_at)
    ORDER BY date ASC
  `, [medicineId, days]);
  return rows;
};

/**
 * Updates inventory policy parameters (reorder_threshold, safety_stock, supplier_lead_time_days).
 * Accessible strictly to Administrator role.
 */
const updateMedicineInventoryPolicy = async (skuOrId, policy, updatedBy, ipAddress) => {
  const medicine = await getMedicineBySku(skuOrId);
  if (!medicine) {
    const err = new Error(`Medicine with identifier '${skuOrId}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const reorderThreshold = policy.reorder_threshold !== undefined ? parseInt(policy.reorder_threshold, 10) : medicine.reorder_threshold;
  const safetyStock = policy.safety_stock !== undefined ? parseInt(policy.safety_stock, 10) : medicine.safety_stock;
  const supplierLeadTimeDays = policy.supplier_lead_time_days !== undefined ? parseInt(policy.supplier_lead_time_days, 10) : medicine.supplier_lead_time_days;

  if (isNaN(reorderThreshold) || reorderThreshold < 0) {
    const err = new Error('reorder_threshold must be a non-negative integer.');
    err.statusCode = 400;
    throw err;
  }
  if (isNaN(safetyStock) || safetyStock < 0) {
    const err = new Error('safety_stock must be a non-negative integer.');
    err.statusCode = 400;
    throw err;
  }
  if (isNaN(supplierLeadTimeDays) || supplierLeadTimeDays <= 0) {
    const err = new Error('supplier_lead_time_days must be a positive integer (> 0).');
    err.statusCode = 400;
    throw err;
  }

  const { rows } = await query(`
    UPDATE medicines
    SET reorder_threshold = $1,
        safety_stock = $2,
        supplier_lead_time_days = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING id, sku, name, generic_name, category, reorder_threshold, safety_stock, supplier_lead_time_days, updated_at
  `, [reorderThreshold, safetyStock, supplierLeadTimeDays, medicine.id]);

  await logAuditEvent({
    userId: updatedBy,
    action: 'UPDATE_INVENTORY_POLICY',
    resourceType: 'medicine',
    resourceId: medicine.id,
    details: {
      sku: medicine.sku,
      reorder_threshold: reorderThreshold,
      safety_stock: safetyStock,
      supplier_lead_time_days: supplierLeadTimeDays,
    },
    ipAddress,
  });

  return rows[0];
};

/**
 * Builds continuous daily chronological timeline from sparse historical records.
 */
function buildContinuousDailyHistory(historicalRecords, targetDays = 35) {
  const recordMap = new Map();
  for (const r of historicalRecords) {
    recordMap.set(r.date, parseFloat(r.quantity_dispensed));
  }

  const points = [];
  const now = new Date();
  for (let i = targetDays; i >= 1; i--) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - i);
    const dateStr = dt.toISOString().split('T')[0];
    const qty = recordMap.has(dateStr) ? recordMap.get(dateStr) : 0.0;
    points.push({ date: dateStr, quantity_dispensed: qty });
  }
  return points;
}

/**
 * Analyzes inventory health backed by PostgreSQL database with support for simulation overrides.
 */
const analyzeInventoryWithDatabase = async ({
  medicineId,
  horizonDays = 14,
  currentStockOverride,
  leadTimeDaysOverride,
  safetyStockOverride,
  reorderPointOverride,
  historyOverride,
}) => {
  // 1. Resolve medicine from PostgreSQL by SKU or UUID
  const medicine = await getMedicineBySku(medicineId);
  if (!medicine) {
    const err = new Error(`Medicine with identifier '${medicineId}' not found in database.`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Resolve parameters (PostgreSQL default vs explicit simulation override)
  const currentStock = currentStockOverride !== undefined
    ? parseFloat(currentStockOverride)
    : await getAggregateStock(medicine.id);

  const reorderPoint = reorderPointOverride !== undefined
    ? parseFloat(reorderPointOverride)
    : parseFloat(medicine.reorder_threshold);

  const safetyStock = safetyStockOverride !== undefined
    ? parseFloat(safetyStockOverride)
    : parseFloat(medicine.safety_stock);

  const leadTimeDays = leadTimeDaysOverride !== undefined
    ? parseInt(leadTimeDaysOverride, 10)
    : parseInt(medicine.supplier_lead_time_days, 10);

  // 3. Resolve historical dispensing timeline
  let historyPoints;
  if (historyOverride && Array.isArray(historyOverride) && historyOverride.length >= 28) {
    historyPoints = historyOverride;
  } else {
    const rawHistory = await getHistoricalDemand(medicine.id, 35);
    historyPoints = buildContinuousDailyHistory(rawHistory, 35);
  }

  // 4. Dispatch to Python ML Forecasting Service
  const forecastingServiceUrl = process.env.FORECASTING_SERVICE_URL || 'http://127.0.0.1:8000';
  
  // Map SKU to standard ATC code if mapped or pass through
  const payload = {
    medicine_id: medicine.sku,
    horizon_days: horizonDays,
    history: historyPoints,
    current_stock: currentStock,
    lead_time_days: leadTimeDays,
    safety_stock: safetyStock,
    reorder_point: reorderPoint,
  };

  const response = await fetch(`${forecastingServiceUrl}/api/pharmacy/inventory/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const err = new Error(errorBody.detail || errorBody.message || 'Forecasting service error.');
    err.statusCode = response.status;
    throw err;
  }

  const result = await response.json();
  return {
    ...result,
    source: 'database_backed',
    overrides_applied: {
      current_stock: currentStockOverride !== undefined,
      lead_time_days: leadTimeDaysOverride !== undefined,
      safety_stock: safetyStockOverride !== undefined,
      reorder_point: reorderPointOverride !== undefined,
      history: Boolean(historyOverride),
    },
  };
};

module.exports = {
  getMedicines,
  getMedicineBySku,
  getInventory,
  getAggregateStock,
  getHistoricalDemand,
  getLowStockAlerts,
  getExpiringAlerts,
  dispenseMedicine,
  updateMedicineInventoryPolicy,
  analyzeInventoryWithDatabase,
};
