'use strict';

const authService = require('../services/authService');

/**
 * Controller for authentication and audit log access (Module 12).
 */

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, role, phoneNumber } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Missing required registration fields: email, password, fullName, and role are required.',
      });
    }

    const passwordHash = await authService.hashPassword(password);
    const user = await authService.registerUser(
      { email, passwordHash, fullName, role, phoneNumber },
      req.ip
    );


    return res.status(201).json({
      message: 'User registered successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Email and password are required.',
      });
    }

    const session = await authService.authenticateUser(email, password, req.ip);

    return res.status(200).json({
      message: 'Login successful.',
      ...session,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};

const getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await authService.getAuditLogs(limit);

    return res.status(200).json({
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

const createAuditLog = async (req, res, next) => {
  try {
    const { action, resourceType, resourceId, details, userId, ipAddress } = req.body;
    const { logAuditEvent } = require('../utils/auditLogger');
    await logAuditEvent({
      userId: userId || req.user?.id || 'system-admin',
      action: action || 'SECURITY_AUDIT',
      resourceType: resourceType || 'PHARMACY',
      resourceId: resourceId || null,
      details: details || {},
      ipAddress: ipAddress || req.ip || '127.0.0.1',
    });

    return res.status(201).json({
      success: true,
      message: 'Audit event persisted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAuditLogs,
  createAuditLog,
};
