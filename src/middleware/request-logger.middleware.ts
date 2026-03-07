/**
 * HTTP request logger middleware.
 *
 * Logs every incoming request and its response status using Winston.
 * Sensitive headers are never logged — see the logger redaction config.
 *
 * @module middleware/request-logger
 */

import type { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger.js'

/**
 * Log inbound HTTP requests and their responses.
 *
 * @param req - Express request.
 * @param res - Express response.
 * @param next - Next middleware.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const level = res.statusCode >= 400 ? 'warn' : 'info'

    logger.log(level, `${req.method} ${req.originalUrl} ${String(res.statusCode)}`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })
  })

  next()
}
