import express from 'express'
import request from 'supertest'
import { createRateLimiter } from '../../src/middleware/rate-limit.middleware.js'

/**
 * Create a test app with a route-level limiter for integration testing.
 *
 * @param maxRequests - Maximum allowed requests.
 * @param windowSeconds - Rate-limit window in seconds.
 * @returns Configured Express app.
 */
function createRateLimitedApp(maxRequests: number, windowSeconds: number): express.Express {
  const app = express()
  app.use(createRateLimiter(maxRequests, windowSeconds))
  app.get('/limited', (_req, res) => {
    res.status(200).json({ success: true })
  })
  return app
}

describe('Rate-limit Integration', () => {
  it('should allow requests under the configured limit', async () => {
    const app = createRateLimitedApp(3, 60)

    const res1 = await request(app).get('/limited')
    const res2 = await request(app).get('/limited')

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
  })

  it('should return 429 after exceeding configured limit', async () => {
    const app = createRateLimitedApp(2, 60)

    await request(app).get('/limited')
    await request(app).get('/limited')
    const blocked = await request(app).get('/limited')

    expect(blocked.status).toBe(429)
    expect(blocked.body).toMatchObject({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: expect.stringContaining('Too many requests'),
      },
    })
  })
})
