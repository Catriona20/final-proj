'use strict';

/**
 * Centralized error-handling middleware.
 * Captures all unhandled errors passed to next(err).
 *
 * @param {Error & { statusCode?: number, status?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    statusCode,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: isProduction && statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
