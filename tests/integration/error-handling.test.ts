import request from 'supertest'
import { getTestApp } from '../helpers/app.helper.js'

describe('Error Handling Middleware', () => {
  const app = getTestApp()

  it('should return JSON for all error responses', async () => {
    const res = await request(app).get('/api/v1/nonexistent')

    expect(res.headers['content-type']).toMatch(/json/)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toHaveProperty('code')
    expect(res.body.error).toHaveProperty('message')
  })

  it('should not leak stack traces in error responses', async () => {
    const res = await request(app).get('/api/v1/nonexistent')

    expect(res.body.error.stack).toBeUndefined()
    expect(res.body.stack).toBeUndefined()
  })
})
