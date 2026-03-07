/**
 * Request ID middleware.
 *
 * Attaches a unique correlation ID to every incoming request.
 * This ID propagates through logs and responses, making it
 * easy to trace a single request across the entire stack.
 *
 * @module middleware/request-id
 */

import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/** Header name used for the correlation ID. */
export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Attach a unique request ID to every request.
 *
 * If the client sends an `x-request-id` header, it is reused.
 * Otherwise a new UUIDv4 is generated.
 *
 * @param req - Express request.
 * @param res - Express response.
 * @param next - Next middleware.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers[REQUEST_ID_HEADER]
  const requestId = typeof existingId === 'string' && existingId.length > 0 ? existingId : uuidv4()

  req.requestId = requestId
  res.setHeader(REQUEST_ID_HEADER, requestId)

  next()
}
