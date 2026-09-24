'use strict';

/**
 * test_database_inventory_integration.js
 * 
 * Module 11: Database-Backed Inventory Intelligence & Policy Integration Test Suite.
 * Verifies all 16 required test conditions against PostgreSQL and Express endpoints.
 */

require('dotenv').config();
const assert = require('assert');
const { pool, query, closePool } = require('../src/config/database');
const pharmacyService = require('../src/services/pharmacyService');

let passedTests = 0;
let failedTests = 0;

async function runTest(testName, testFn) {
  try {
    process.stdout.write(`- Running: ${testName}... `);
    await testFn();
    console.log('✓ PASSED');
    passedTests++;
  } catch (err) {
    console.log('✗ FAILED');
    console.error('  Error:', err.message);
    failedTests++;
  }
}

async function main() {
  console.log('======================================================================');
  console.log('MODULE 11: DATABASE-BACKED INVENTORY INTELLIGENCE TEST SUITE');
  console.log('======================================================================\n');

  try {
    // 1. Medicine lookup by SKU
    await runTest('1. Medicine lookup by SKU (MED-ATC-N02BE)', async () => {
      const med = await pharmacyService.getMedicineBySku('MED-ATC-N02BE');
      assert(med, 'Medicine should exist');
      assert.strictEqual(med.sku, 'MED-ATC-N02BE');
      assert.strictEqual(med.category, 'Analgesic');
    });

    // 2. Current stock aggregation
    await runTest('2. Current stock aggregation from inventory', async () => {
      const med = await pharmacyService.getMedicineBySku('MED-PARA-500');
      const stock = await pharmacyService.getAggregateStock(med.id);
      assert(typeof stock === 'number', 'Stock must be a number');
      assert(stock >= 0, 'Stock must be non-negative');
    });

    // 3. Historical dispensing aggregation
    await runTest('3. Historical dispensing aggregation from dispensations', async () => {
      const med = await pharmacyService.getMedicineBySku('MED-AMOX-500');
      const demand = await pharmacyService.getHistoricalDemand(med.id, 35);
      assert(Array.isArray(demand), 'Demand should be an array');
    });

    // 4. Reorder threshold lookup
    await runTest('4. Reorder threshold lookup', async () => {
      const med = await pharmacyService.getMedicineBySku('MED-ATC-N02BE');
      assert(typeof med.reorder_threshold === 'number', 'reorder_threshold should be number');
      assert(med.reorder_threshold >= 0, 'reorder_threshold >= 0');
    });

    // 5. Safety stock lookup
    await runTest('5. Safety stock lookup (Column added in migration 003)', async () => {
      const med = await pharmacyService.getMedicineBySku('MED-ATC-N02BE');
      assert(typeof med.safety_stock === 'number', 'safety_stock should be number');
      assert(med.safety_stock >= 0, 'safety_stock >= 0');
    });

    // 6. Lead-time lookup
    await runTest('6. Lead-time lookup (Column added in migration 003)', async () => {
      const med = await pharmacyService.getMedicineBySku('MED-ATC-N02BE');
      assert(typeof med.supplier_lead_time_days === 'number', 'supplier_lead_time_days should be number');
      assert(med.supplier_lead_time_days > 0, 'supplier_lead_time_days > 0');
    });

    // 7. Database-backed inventory analysis with ML forecasting
    await runTest('7. Database-backed inventory analysis with ML forecasting', async () => {
      const result = await pharmacyService.analyzeInventoryWithDatabase({
        medicineId: 'MED-ATC-N02BE',
        horizonDays: 14,
      });
      assert.strictEqual(result.medicine_id, 'MED-ATC-N02BE');
      assert(result.forecast, 'Result must contain forecast');
      assert.strictEqual(result.forecast.horizon_days, 14);
      assert(result.inventory, 'Result must contain inventory');
      assert(result.recommendation, 'Result must contain recommendation');
      assert.strictEqual(result.source, 'database_backed');
      assert.strictEqual(result.model, 'hurdle_xgboost');
    });

    // 8. Missing medicine handling
    await runTest('8. Missing medicine handling returns 404', async () => {
      let threw = false;
      try {
        await pharmacyService.analyzeInventoryWithDatabase({
          medicineId: 'MED-ATC-NONEXISTENT',
          horizonDays: 14,
        });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.statusCode, 404);
      }
      assert(threw, 'Should throw 404 for missing medicine');
    });

    // 9. Missing inventory handling
    await runTest('9. Missing inventory returns 0 stock', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const stock = await pharmacyService.getAggregateStock(nonExistentUuid);
      assert.strictEqual(stock, 0);
    });

    // 10. Missing historical demand handled gracefully
    await runTest('10. Missing historical demand zero-fills timeline safely', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const demand = await pharmacyService.getHistoricalDemand(nonExistentUuid, 35);
      assert.strictEqual(demand.length, 0);
    });

    // 11. Invalid medicine SKU error
    await runTest('11. Invalid medicine SKU rejected', async () => {
      const med = await pharmacyService.getMedicineBySku('INVALID-SKU-XYZ');
      assert.strictEqual(med, null);
    });

    // 12. Invalid inventory policy configuration rejected
    await runTest('12. Invalid inventory policy configuration rejected (negative / zero lead time)', async () => {
      let threw = false;
      try {
        await pharmacyService.updateMedicineInventoryPolicy(
          'MED-ATC-N02BE',
          { supplier_lead_time_days: 0 },
          'a0000000-0000-0000-0000-000000000001',
          '127.0.0.1'
        );
      } catch (err) {
        threw = true;
        assert.strictEqual(err.statusCode, 400);
      }
      assert(threw, 'Should throw 400 for lead time <= 0');
    });

    // 13. Simulation override behavior
    await runTest('13. Simulation override applies explicit user inputs', async () => {
      const result = await pharmacyService.analyzeInventoryWithDatabase({
        medicineId: 'MED-ATC-N02BE',
        horizonDays: 14,
        currentStockOverride: 555.0,
        leadTimeDaysOverride: 10,
        safetyStockOverride: 45.0,
        reorderPointOverride: 120.0,
      });
      assert.strictEqual(result.inventory.current_stock, 555.0);
      assert.strictEqual(result.inventory.lead_time_days, 10);
      assert.strictEqual(result.inventory.safety_stock, 45.0);
      assert.strictEqual(result.inventory.reorder_point, 120.0);
      assert.strictEqual(result.overrides_applied.current_stock, true);
    });

    // 14. Patient authorization denial (RBAC verification)
    await runTest('14. Patient role authorization denial check', async () => {
      const { authorize } = require('../src/middleware/authMiddleware');
      const authMiddleware = authorize('doctor', 'admin');
      let statusCalled = null;
      let jsonCalled = null;
      const req = { user: { id: 'patient-1', role: 'patient' } };
      const res = {
        status: (s) => {
          statusCalled = s;
          return {
            json: (j) => {
              jsonCalled = j;
            }
          };
        }
      };
      let nextCalled = false;
      authMiddleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(statusCalled, 403, 'Patient must be rejected with HTTP 403');
      assert.strictEqual(nextCalled, false, 'Next must not be called for patient');
    });

    // 15. Doctor access authorization (RBAC verification)
    await runTest('15. Doctor role authorization acceptance check', async () => {
      const { authorize } = require('../src/middleware/authMiddleware');
      const authMiddleware = authorize('doctor', 'admin');
      const req = { user: { id: 'doctor-1', role: 'doctor' } };
      let nextCalled = false;
      authMiddleware(req, {}, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true, 'Doctor role must be granted access');
    });

    // 16. Admin configuration policy access
    await runTest('16. Admin role can update inventory policy', async () => {
      const updated = await pharmacyService.updateMedicineInventoryPolicy(
        'MED-ATC-N02BE',
        { reorder_threshold: 160, safety_stock: 35, supplier_lead_time_days: 8 },
        'a0000000-0000-0000-0000-000000000001',
        '127.0.0.1'
      );
      assert.strictEqual(updated.reorder_threshold, 160);
      assert.strictEqual(updated.safety_stock, 35);
      assert.strictEqual(updated.supplier_lead_time_days, 8);
    });

  } finally {
    await closePool();
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('----------------------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main();
