/**
 * 404 Not Found handler middleware.
 *
 * Catches all requests that did not match any registered route
 * and returns a standardised error response.
 *
 * @module middleware/not-found
 */

import type { Request, Response } from 'express'
import { sendError } from '../utils/api-response.js'

/**
 * Handle requests to unknown routes.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`)
}
