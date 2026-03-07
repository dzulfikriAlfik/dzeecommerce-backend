/**
 * Centralised error-handling middleware.
 *
 * This must be the **last** middleware registered on the Express app.
 * It catches all errors, distinguishes operational `AppError` instances
 * from unexpected errors, and returns a safe, consistent envelope.
 *
 * @module middleware/error
 */

import type { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError } from '../utils/errors.js'
import { sendError } from '../utils/api-response.js'
import { logger } from '../config/logger.js'
import { appConfig } from '../config/app.config.js'

/**
 * Global Express error handler.
 *
 * @param err - The thrown or forwarded error.
 * @param req - Express request.
 * @param res - Express response.
 * @param _next - Next function (required by Express error handler signature).
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Known operational error ──
  if (err instanceof ValidationError) {
    sendError(res, err.statusCode, err.code, err.message, err.details)
    return
  }

  if (err instanceof AppError) {
    // Log operational errors at warn level
    logger.warn(err.message, {
      requestId: req.requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.originalUrl,
    })

    sendError(res, err.statusCode, err.code, err.message)
    return
  }

  // ── Unexpected / programmer error ──
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  })

  const message = appConfig.isProduction
    ? 'An unexpected error occurred'
    : err.message

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', message)
}
