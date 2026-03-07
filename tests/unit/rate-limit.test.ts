/**
 * Rate limit middleware unit tests.
 *
 * Tests the rate limiter factory and its behavior when requests
 * exceed the configured limit.
 */

import request from 'supertest'
import express from 'express'
import { createRateLimiter } from '../../src/middleware/rate-limit.middleware.js'

/**
 * Create a mini Express app with a rate-limited route.
 *
 * @param maxRequests - Max requests allowed in the window.
 * @param windowSeconds - Window duration in seconds.
 * @returns Express app.
 */
function createRateLimitedApp(maxRequests: number, windowSeconds: number): express.Express {
  const app = express()
  app.use(createRateLimiter(maxRequests, windowSeconds))
  app.get('/test', (_req, res) => {
    res.json({ success: true, data: 'ok' })
  })
  return app
}

describe('Rate Limit Middleware', () => {
  it('should allow requests within the limit', async () => {
    const app = createRateLimitedApp(5, 60)

    const res = await request(app).get('/test')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should return 429 when rate limit is exceeded', async () => {
    const app = createRateLimitedApp(2, 60)

    // Exhaust the limit
    await request(app).get('/test')
    await request(app).get('/test')

    // This request should be rate-limited
    const res = await request(app).get('/test')

    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: expect.stringContaining('Too many requests'),
      },
    })
  })

  it('should create a custom limiter when parameters are provided', async () => {
    const app = createRateLimitedApp(1, 60)

    // First request passes
    const res1 = await request(app).get('/test')
    expect(res1.status).toBe(200)

    // Second request should be blocked
    const res2 = await request(app).get('/test')
    expect(res2.status).toBe(429)
  })

  it('should use default limiter when no parameters are provided', async () => {
    const app = express()
    app.use(createRateLimiter())
    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })

    // Default limit is high (100), so a single request should pass
    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
  })

  it('should use default window when only maxRequests is provided', async () => {
    const app = express()
    app.use(createRateLimiter(50, undefined))
    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })

    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
  })

  it('should use default maxRequests when only windowSeconds is provided', async () => {
    const app = express()
    app.use(createRateLimiter(undefined, 30))
    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })

    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
  })

  it('should handle requests with undefined IP gracefully', async () => {
    const app = express()
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'ip', { value: undefined })
      next()
    })
    app.use(createRateLimiter(100, 60))
    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })

    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
  })
})
