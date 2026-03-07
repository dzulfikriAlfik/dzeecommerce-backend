import request from 'supertest'
import { getTestApp } from '../helpers/app.helper.js'

describe('Security Headers Integration', () => {
  const app = getTestApp()

  it('should apply helmet baseline headers', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBeDefined()
    expect(res.headers['x-dns-prefetch-control']).toBeDefined()
    expect(res.headers['x-download-options']).toBeDefined()
    expect(res.headers['x-permitted-cross-domain-policies']).toBeDefined()
    expect(res.headers['referrer-policy']).toBeDefined()
  })

  it('should include cross-origin related headers from helmet', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.headers['cross-origin-opener-policy']).toBeDefined()
    expect(res.headers['origin-agent-cluster']).toBeDefined()
  })
})
