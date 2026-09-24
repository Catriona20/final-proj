'use strict';

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const { closePool } = require('./config/database');

const app = express();

// ---------------------------------------------------------------------------
// Security & Utility Middleware
// ---------------------------------------------------------------------------
// 1. Helmet: Set security HTTP response headers
app.use(helmet());

// 2. CORS: Enable Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 3. Morgan: HTTP request logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// 4. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
// Mount top-level application routes
app.use('/', routes);

// Fallback 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error-handling middleware
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Server Initialization & Graceful Shutdown
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '4000', 10);
let server;

// Only start the HTTP listener if this file is run directly
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`[pharmacy-security-service] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

/**
 * Handles graceful shutdown by stopping the server and closing active database pools.
 * @param {string} signal - The signal that triggered the shutdown (SIGTERM / SIGINT)
 */
const shutdown = async (signal) => {
  console.log(`\n[pharmacy-security-service] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[pharmacy-security-service] HTTP server closed.');
      try {
        await closePool();
        console.log('[pharmacy-security-service] Graceful shutdown complete.');
        process.exit(0);
      } catch (err) {
        console.error('[pharmacy-security-service] Error during database shutdown:', err.message);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if connections refuse to close
    setTimeout(() => {
      console.error('[pharmacy-security-service] Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 10000).unref();
  } else {
    try {
      await closePool();
    } catch (e) {
      // ignore
    }
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
