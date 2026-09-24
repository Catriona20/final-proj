'use strict';

const { query } = require('../config/database');

/**
 * Basic health check endpoint.
 * Returns standard service health status.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getHealth = (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'pharmacy-security-service',
  });
};

/**
 * Database health check endpoint.
 * Executes a PostgreSQL query (SELECT NOW()) to verify database connectivity.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getDbHealth = async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    const responseTimeMs = Date.now() - startTime;

    return res.status(200).json({
      status: 'healthy',
      service: 'pharmacy-security-service',
      database: {
        status: 'connected',
        responseTimeMs,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version,
      },
    });
  } catch (error) {
    const errorMessage =
      (error.errors && error.errors.length)
        ? error.errors.map((e) => e.message || e.code).join('; ')
        : (error.message || error.code || String(error));

    console.error('[Health Check Error] Database query failed:', errorMessage);

    return res.status(503).json({
      status: 'unhealthy',
      service: 'pharmacy-security-service',
      database: {
        status: 'disconnected',
        error: errorMessage,
      },
    });
  }
};

module.exports = {
  getHealth,
  getDbHealth,
};
