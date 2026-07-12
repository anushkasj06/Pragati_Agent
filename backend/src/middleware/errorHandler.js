import { logger } from "../config/logger.js";
import { formatError } from "../utils/responseFormatter.js";

/**
 * Global error handler — returns structured JSON errors.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  logger.error("Request error", {
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(statusCode).json(formatError(message));
}

/**
 * Create an HTTP error with status code.
 * @param {number} statusCode
 * @param {string} message
 * @returns {Error}
 */
export function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
