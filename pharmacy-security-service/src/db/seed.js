'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool, dbConfig } = require('../config/database');

/**
 * Development seed runner.
 * Reads and executes SQL seed scripts within a database transaction.
 */
async function runSeeds() {
  let client;
  console.log(`[Seed Runner] Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

  try {
    client = await pool.connect();
    console.log('[Seed Runner] Successfully connected to database.');

    const seedsDir = path.join(__dirname, 'seeds');
    if (!fs.existsSync(seedsDir)) {
      console.log('[Seed Runner] No seeds directory found.');
      return;
    }

    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[Seed Runner] No seed files found.');
      return;
    }

    for (const file of files) {
      console.log(`[Seed Runner] > Executing seed script: ${file}...`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`[Seed Runner] ✓ Seed executed successfully: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Seed Runner] ✗ Failed executing seed: ${file}`);
        throw err;
      }
    }

    // Verify row counts of seeded tables
    const userCount = await client.query('SELECT COUNT(*)::int as count FROM users');
    const medicineCount = await client.query('SELECT COUNT(*)::int as count FROM medicines');
    const inventoryCount = await client.query('SELECT COUNT(*)::int as count FROM inventory');
    const prescriptionCount = await client.query('SELECT COUNT(*)::int as count FROM prescriptions');

    console.log('\n[Seed Runner] Seeding Summary:');
    console.log(`  - Users:         ${userCount.rows[0].count} records`);
    console.log(`  - Medicines:     ${medicineCount.rows[0].count} records`);
    console.log(`  - Inventory:     ${inventoryCount.rows[0].count} records`);
    console.log(`  - Prescriptions: ${prescriptionCount.rows[0].count} records`);
    console.log('[Seed Runner] All development seed data successfully applied.\n');
  } catch (error) {
    const errorMsg =
      error.errors && error.errors.length
        ? error.errors.map((e) => e.message || e.code).join('; ')
        : error.message || error.code || String(error);

    console.error('\n[Seed Runner Error]: Unable to execute database seeds.');
    console.error(`Reason: ${errorMsg}`);
    console.error(`Target: host=${dbConfig.host} port=${dbConfig.port} db=${dbConfig.database} user=${dbConfig.user}`);
    console.error('Please verify that PostgreSQL server is running, migrations are applied, and credentials in .env are correct.\n');
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Execute runner if executed directly via node
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };
