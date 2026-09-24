'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool, dbConfig } = require('../config/database');

/**
 * Lightweight, direct SQL migration runner.
 * Maintains a `schema_migrations` table in PostgreSQL to ensure idempotency.
 */
async function runMigrations() {
  let client;
  console.log(`[Migration Runner] Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

  try {
    client = await pool.connect();
    console.log('[Migration Runner] Successfully connected to database.');

    // 1. Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch applied migrations
    const { rows: appliedRows } = await client.query(
      'SELECT migration_name FROM schema_migrations ORDER BY id ASC'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.migration_name));

    // 3. Read migration files from disk
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migration Runner] No migrations directory found.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[Migration Runner] No migration files found.');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[Migration Runner] - Skipping already applied: ${file}`);
        continue;
      }

      console.log(`[Migration Runner] > Executing migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute within a strict transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migration Runner] ✓ Applied successfully: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration Runner] ✗ Failed executing: ${file}`);
        throw err;
      }
    }

    console.log(
      `[Migration Runner] Completed. ${appliedCount} new migration(s) applied. Total applied: ${
        appliedSet.size + appliedCount
      }.`
    );
  } catch (error) {
    const errorMsg =
      error.errors && error.errors.length
        ? error.errors.map((e) => e.message || e.code).join('; ')
        : error.message || error.code || String(error);

    console.error('\n[Migration Runner Error]: Unable to complete database migrations.');
    console.error(`Reason: ${errorMsg}`);
    console.error(`Target: host=${dbConfig.host} port=${dbConfig.port} db=${dbConfig.database} user=${dbConfig.user}`);
    console.error('Please verify that PostgreSQL server is running and accessible.\n');
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
  runMigrations();
}

module.exports = { runMigrations };
