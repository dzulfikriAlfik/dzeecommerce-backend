/**
 * Rate limiting middleware using rate-limiter-flexible.
 *
 * Applies a simple in-memory rate limiter.
 * For multi-instance production deployments, swap the memory store
 * for a Redis-backed store.
 *
 * @module middleware/rate-limit
 */

import type { Request, Response, NextFunction } from 'express'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { rateLimitConfig } from '../config/app.config.js'
import { sendError } from '../utils/api-response.js'

/** Default rate limiter instance. */
const defaultLimiter = new RateLimiterMemory({
  points: rateLimitConfig.maxRequests,
  duration: Math.round(rateLimitConfig.windowMs / 1000),
})

/**
 * Create a rate-limiting middleware with optional custom limits.
 *
 * @param maxRequests - Maximum allowed requests in the window.
 * @param windowSeconds - Time window in seconds.
 * @returns Express middleware function.
 */
export function createRateLimiter(
  maxRequests?: number,
  windowSeconds?: number,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const limiter =
    maxRequests !== undefined || windowSeconds !== undefined
      ? new RateLimiterMemory({
          points: maxRequests ?? rateLimitConfig.maxRequests,
          duration: windowSeconds ?? Math.round(rateLimitConfig.windowMs / 1000),
        })
      : defaultLimiter

  /**
   * Rate-limit incoming request by IP.
   *
   * @param req - Express request.
   * @param res - Express response.
   * @param next - Next middleware.
   */
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.ip ?? 'unknown'
      await limiter.consume(key)
      next()
    } catch {
      sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many requests, please try again later')
    }
  }
}

/** Default rate limiter middleware for general routes. */
export const rateLimitMiddleware = createRateLimiter()
