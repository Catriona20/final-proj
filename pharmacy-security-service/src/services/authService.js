const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * Authentication Service (Module 12)
 * Handles registration, credential verification, and user session context.
 */

/**
 * Hashes a plaintext password using bcrypt with standard cost factor 10.
 *
 * @param {string} plaintextPassword
 * @returns {Promise<string>}
 */
const hashPassword = async (plaintextPassword) => {
  if (!plaintextPassword || typeof plaintextPassword !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plaintextPassword, salt);
};

/**
 * Compares plaintext password against stored bcrypt hash.
 *
 * @param {string} plaintextPassword
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (plaintextPassword, storedHash) => {
  if (!plaintextPassword || !storedHash) return false;
  // Fallback for dev placeholder seed strings if present in dev mode
  if (process.env.NODE_ENV !== 'production' && storedHash.startsWith('$2b$10$dev') && plaintextPassword === 'devPassword123!') {
    return true;
  }
  try {
    return await bcrypt.compare(plaintextPassword, storedHash);
  } catch (_err) {
    return false;
  }
};

/**
 * Signs a standard JWT with user claims.
 *
 * @param {Object} user
 * @param {string} user.id
 * @param {string} user.email
 * @param {string} user.role
 * @param {string} [expiresIn]
 * @returns {string}
 */
const generateToken = (user, expiresIn = null) => {
  const secret = process.env.JWT_SECRET || 'dev-fallback-secret-for-tests-only';
  const expiry = expiresIn || process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: expiry }
  );
};

/**
 * Registers a new user with one of the 3 primary platform roles.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} [params.password]
 * @param {string} [params.passwordHash]
 * @param {string} params.fullName
 * @param {'patient'|'doctor'|'admin'} params.role
 * @param {string} [params.phoneNumber]
 * @param {string} [ipAddress]
 */
const registerUser = async ({ email, password, passwordHash, fullName, role, phoneNumber }, ipAddress = null) => {
  const validRoles = ['patient', 'doctor', 'admin'];
  if (!validRoles.includes(role)) {
    const error = new Error(`Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  let finalHash = passwordHash;
  if (!finalHash && password) {
    finalHash = await hashPassword(password);
  }

  if (!finalHash) {
    const error = new Error('Password or passwordHash is required.');
    error.statusCode = 400;
    throw error;
  }

  const text = `
    INSERT INTO users (email, password_hash, full_name, role, phone_number)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, full_name, role, phone_number, is_active, created_at
  `;
  const values = [email.toLowerCase().trim(), finalHash, fullName.trim(), role, phoneNumber || null];

  const { rows } = await query(text, values);
  const user = rows[0];

  await logAuditEvent({
    userId: user.id,
    action: 'USER_REGISTERED',
    resourceType: 'auth',
    resourceId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress,
  });

  return user;
};

/**
 * Authenticates user credentials and returns JWT session context.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} [ipAddress]
 */
const authenticateUser = async (email, password, ipAddress = null) => {
  const text = `
    SELECT id, email, password_hash, full_name, role, is_active
    FROM users
    WHERE email = $1
  `;
  const { rows } = await query(text, [email.toLowerCase().trim()]);
  const user = rows[0];

  if (!user || !user.is_active) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    await logAuditEvent({
      userId: user.id,
      action: 'USER_LOGIN_FAILED',
      resourceType: 'auth',
      resourceId: user.id,
      details: { reason: 'Invalid password attempt' },
      ipAddress,
    });

    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  await logAuditEvent({
    userId: user.id,
    action: 'USER_LOGIN',
    resourceType: 'auth',
    resourceId: user.id,
    details: { role: user.role },
    ipAddress,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  };
};

/**
 * Retrieves audit logs (Admin only).
 *
 * @param {number} [limit=50]
 */
const getAuditLogs = async (limit = 50) => {
  const text = `
    SELECT a.id, a.user_id, u.email as user_email, a.action, a.resource_type,
           a.resource_id, a.details, a.ip_address, a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT $1
  `;
  const { rows } = await query(text, [limit]);
  return rows;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  registerUser,
  authenticateUser,
  getAuditLogs,
};
