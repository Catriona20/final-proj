'use strict';

/**
 * 404 Not Found middleware for unmatched routes.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    service: 'pharmacy-security-service',
  });
};

module.exports = notFoundHandler;
