'use strict';

/**
 * Authentication and Role-Based Access Control (RBAC) Middleware.
 * Supports the 3 primary platform roles: 'patient', 'doctor', 'admin'.
 */

const jwt = require('jsonwebtoken');

/**
 * Validates authentication tokens from the Authorization header.
 * Attaches decoded user context to req.user.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing or malformed. Expected Bearer <token>.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty authentication token provided.',
    });
  }

  // 1. Development token fallback ONLY permitted in non-production environments
  const isProduction = process.env.NODE_ENV === 'production';
  if (token.startsWith('dev-token-')) {
    if (isProduction) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Development tokens are strictly forbidden in production mode.',
      });
    }

    const parts = token.split('-');
    const role = parts[2] || 'patient';
    const id = parts[3] || 'a0000000-0000-0000-0000-000000000001';
    req.user = {
      id,
      email: `dev-${role}@medsecure.local`,
      role,
    };
    return next();
  }

  // 2. Production JWT verification
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      return res.status(500).json({
        error: 'ConfigurationError',
        message: 'JWT_SECRET environment variable is missing in production environment.',
      });
    }
  }

  const secret = jwtSecret || 'dev-fallback-secret-for-tests-only';

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded !== 'object') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token payload claims.',
      });
    }

    const role = decoded.role || 'patient';
    const id = decoded.sub || decoded.id || decoded.userId;

    if (!id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token does not contain a valid user identity claim (sub/id).',
      });
    }

    req.user = {
      id,
      email: decoded.email || null,
      role,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has expired. Please log in again.',
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: `Invalid authentication token: ${error.message}`,
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: `Authentication failed: ${error.message}`,
    });
  }
};

/**
 * RBAC authorization middleware.
 * Verifies that the authenticated user's role is in the allowed list.
 *
 * @param {...('patient'|'doctor'|'admin')} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to authorization.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
