/**
 * Health check route.
 *
 * Returns basic service health information.
 * This route is public and requires no authentication.
 *
 * @module routes/v1/health
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { sendSuccess } from '../../utils/api-response.js'

const router = Router()

/** Health check response payload. */
interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
  environment: string
}

/**
 * GET /api/v1/health
 *
 * Returns a simple health check response.
 *
 * @param _req - Express request (unused).
 * @param res - Express response.
 */
function healthHandler(_req: Request, res: Response): void {
  const health: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] ?? 'unknown',
  }

  sendSuccess(res, health)
}

router.get('/', healthHandler)

export default router
