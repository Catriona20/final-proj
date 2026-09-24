'use strict';

/**
 * test_auth_security_hardening.js
 * 
 * Person 4: Module 12 P1 Security Hardening Test Suite.
 * Validates JWT signing/verification, bcrypt hashing/verification, RBAC matrix,
 * production mode dev-token rejection, and audit log secrecy.
 */

require('dotenv').config();
const assert = require('assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../src/middleware/authMiddleware');
const authService = require('../src/services/authService');
const { pool, closePool } = require('../src/config/database');

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

// Mock Express response helper
function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

async function main() {
  console.log('======================================================================');
  console.log('MODULE 12: AUTHENTICATION & SECURITY HARDENING TEST SUITE');
  console.log('======================================================================\n');

  const originalEnv = process.env.NODE_ENV;
  const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-healthcare-platform-2026-key';

  try {
    // 1. Valid production JWT
    await runTest('1. Valid production JWT accepted and decoded', async () => {
      const token = jwt.sign(
        { sub: 'usr-doc-123', email: 'doctor@clinic.org', role: 'doctor' },
        testSecret,
        { expiresIn: '1h' }
      );
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user.id, 'usr-doc-123');
      assert.strictEqual(req.user.role, 'doctor');
      assert.strictEqual(req.user.email, 'doctor@clinic.org');
    });

    // 2. Invalid JWT (malformed string)
    await runTest('2. Invalid/Malformed JWT rejected with 401', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.payload' } };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.error, 'Unauthorized');
    });

    // 3. Expired JWT
    await runTest('3. Expired JWT rejected with 401 and descriptive message', async () => {
      const token = jwt.sign(
        { sub: 'usr-patient-1', email: 'pat@example.com', role: 'patient' },
        testSecret,
        { expiresIn: '-1s' } // Expired 1 second ago
      );
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert(res.body.message.includes('expired'));
    });

    // 4. Wrong JWT signature
    await runTest('4. JWT with wrong signature rejected with 401', async () => {
      const token = jwt.sign(
        { sub: 'usr-admin-1', role: 'admin' },
        'wrong-attacker-secret-key-12345'
      );
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
    });

    // 5. Missing Authorization header
    await runTest('5. Missing Authorization header rejected with 401', async () => {
      const req = { headers: {} };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
    });

    // 6. Development token in development mode
    await runTest('6. Development token allowed in development mode (NODE_ENV=development)', async () => {
      process.env.NODE_ENV = 'development';
      const req = { headers: { authorization: 'Bearer dev-token-doctor-a0000000-0000-0000-0000-000000000002' } };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user.role, 'doctor');
    });

    // 7. Development token rejected in production mode
    await runTest('7. Development token STRICTLY REJECTED in production mode (NODE_ENV=production)', async () => {
      process.env.NODE_ENV = 'production';
      const req = { headers: { authorization: 'Bearer dev-token-admin-a0000000-0000-0000-0000-000000000001' } };
      const res = createMockRes();
      let nextCalled = false;
      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert(res.body.message.includes('forbidden in production'));
      process.env.NODE_ENV = originalEnv;
    });

    // 8. Patient role authorization
    await runTest('8. Patient role authorized for patient resources, denied for doctor/admin', async () => {
      const patAuth = authorize('patient');
      const docAuth = authorize('doctor', 'admin');

      const req = { user: { id: 'p1', role: 'patient' } };
      const res = createMockRes();

      let next1 = false;
      patAuth(req, res, () => { next1 = true; });
      assert.strictEqual(next1, true);

      let next2 = false;
      docAuth(req, res, () => { next2 = true; });
      assert.strictEqual(next2, false);
      assert.strictEqual(res.statusCode, 403);
    });

    // 9. Doctor role authorization
    await runTest('9. Doctor role authorized for doctor resources, denied for admin-only policy', async () => {
      const docAuth = authorize('doctor', 'admin');
      const adminOnlyAuth = authorize('admin');

      const req = { user: { id: 'd1', role: 'doctor' } };
      const res = createMockRes();

      let next1 = false;
      docAuth(req, res, () => { next1 = true; });
      assert.strictEqual(next1, true);

      let next2 = false;
      adminOnlyAuth(req, res, () => { next2 = true; });
      assert.strictEqual(next2, false);
      assert.strictEqual(res.statusCode, 403);
    });

    // 10. Admin role authorization
    await runTest('10. Admin role authorized across all operational and admin resources', async () => {
      const docAuth = authorize('doctor', 'admin');
      const adminOnlyAuth = authorize('admin');

      const req = { user: { id: 'adm1', role: 'admin' } };
      const res = createMockRes();

      let next1 = false;
      docAuth(req, res, () => { next1 = true; });
      assert.strictEqual(next1, true);

      let next2 = false;
      adminOnlyAuth(req, res, () => { next2 = true; });
      assert.strictEqual(next2, true);
    });

    // 11. Valid password verification using bcrypt
    await runTest('11. Valid password verification with bcryptjs hash', async () => {
      const plain = 'SecureDoctorPass2026!';
      const hash = await authService.hashPassword(plain);
      assert(hash.startsWith('$2'), 'Bcrypt hash must start with $2');

      const isMatch = await authService.comparePassword(plain, hash);
      assert.strictEqual(isMatch, true, 'Valid password must match hash');
    });

    // 12. Invalid password verification
    await runTest('12. Invalid password verification correctly rejected', async () => {
      const plain = 'SecureDoctorPass2026!';
      const wrong = 'IncorrectPasswordAttempt!';
      const hash = await authService.hashPassword(plain);

      const isMatch = await authService.comparePassword(wrong, hash);
      assert.strictEqual(isMatch, false, 'Wrong password must NOT match');
    });

    // 13. No plaintext password exposure
    await runTest('13. User registration and auth return objects contain NO plaintext password or hash', async () => {
      const plain = 'SafePasswordTest789!';
      const testEmail = `sec_test_${Date.now()}@medsecure.local`;
      const registered = await authService.registerUser({
        email: testEmail,
        password: plain,
        fullName: 'Security Test User',
        role: 'doctor',
      });

      assert(!registered.password, 'Registered object must not include password');
      assert(!registered.password_hash, 'Registered object must not include password_hash');

      const authResult = await authService.authenticateUser(testEmail, plain);
      assert(authResult.token, 'Auth result must have token');
      assert(!authResult.user.password, 'Auth user object must not include password');
      assert(!authResult.user.password_hash, 'Auth user object must not include password_hash');
    });

  } finally {
    process.env.NODE_ENV = originalEnv;
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
