'use strict';

const { query } = require('../config/database');

/**
 * Persists an immutable security/operational audit event into PostgreSQL.
 *
 * @param {Object} params
 * @param {string|null} [params.userId] - ID of the user performing the action
 * @param {string} params.action - Verb describing the action (e.g. 'USER_LOGIN', 'DISPENSE_MEDICINE')
 * @param {string} params.resourceType - Domain entity affected (e.g. 'auth', 'inventory', 'prescription')
 * @param {string|null} [params.resourceId] - Primary key of the affected entity
 * @param {Object} [params.details] - JSON payload describing context or changes
 * @param {string|null} [params.ipAddress] - Client IP address
 * @returns {Promise<void>}
 */
const logAuditEvent = async ({
  userId = null,
  action,
  resourceType,
  resourceId = null,
  details = {},
  ipAddress = null,
}) => {
  try {
    const text = `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
    ];
    await query(text, values);
  } catch (error) {
    // Non-blocking catch to prevent audit failure from crashing main business transactions
    console.error('[Audit Logger Error] Failed to persist audit event:', error.message);
  }
};

module.exports = {
  logAuditEvent,
};
