import request from 'supertest'
import { getTestApp } from '../helpers/app.helper.js'

describe('GET /api/v1/health', () => {
  const app = getTestApp()

  it('should return 200 with success envelope', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        environment: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      },
    })
  })

  it('should return a valid ISO timestamp', async () => {
    const res = await request(app).get('/api/v1/health')

    const timestamp = new Date(res.body.data.timestamp)
    expect(timestamp.toISOString()).toBe(res.body.data.timestamp)
  })

  it('should include x-request-id header in the response', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.headers['x-request-id']).toBeDefined()
    expect(typeof res.headers['x-request-id']).toBe('string')
  })

  it('should echo back a provided x-request-id', async () => {
    const customId = 'test-request-id-123'
    const res = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', customId)

    expect(res.headers['x-request-id']).toBe(customId)
  })

  it('should include security headers from helmet', async () => {
    const res = await request(app).get('/api/v1/health')

    // Helmet sets various security headers
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBeDefined()
  })
})
