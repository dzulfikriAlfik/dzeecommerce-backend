import request from 'supertest'
import { getTestApp } from '../helpers/app.helper.js'

describe('Not Found Handler', () => {
  const app = getTestApp()

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route')

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
      },
    })
  })

  it('should return 404 for completely unknown paths', async () => {
    const res = await request(app).get('/random/path')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
