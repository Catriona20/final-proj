require('dotenv').config();
const { query, closePool } = require('../config/database');

async function check() {
  try {
    const res = await query(`
      SELECT id, sku, name, generic_name, category, reorder_threshold, safety_stock, supplier_lead_time_days 
      FROM medicines;
    `);
    console.log('Existing Medicines:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await closePool();
  }
}

check();
