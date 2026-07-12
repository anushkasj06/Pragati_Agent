import { logger } from "../config/logger.js";

/**
 * Log incoming HTTP requests with method, path, and duration.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    logger.info("Incoming request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      ip: req.ip,
    });
  });

  next();
}
