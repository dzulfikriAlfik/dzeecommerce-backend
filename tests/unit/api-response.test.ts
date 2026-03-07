import { jest } from '@jest/globals'
import type { Response } from 'express'
import { sendSuccess, sendError } from '../../src/utils/api-response.js'

/**
 * Create a mock Express response object for unit tests.
 */
function createMockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis() as unknown,
    json: jest.fn().mockReturnThis() as unknown,
  } as unknown as Response
  return res
}

describe('API Response Utilities', () => {
  describe('sendSuccess', () => {
    it('should return success envelope with data', () => {
      const res = createMockResponse()
      const data = { id: 1, name: 'Test' }

      sendSuccess(res, data)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
      })
    })

    it('should support custom status codes', () => {
      const res = createMockResponse()
      sendSuccess(res, { created: true }, 201)

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('should include meta when provided', () => {
      const res = createMockResponse()
      const meta = { page: 1, total: 100 }

      sendSuccess(res, [], 200, meta)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        meta,
      })
    })
  })

  describe('sendError', () => {
    it('should return error envelope', () => {
      const res = createMockResponse()

      sendError(res, 400, 'BAD_REQUEST', 'Invalid input')

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
        },
      })
    })

    it('should include validation details when provided', () => {
      const res = createMockResponse()
      const details = { email: ['Required'] }

      sendError(res, 422, 'VALIDATION_ERROR', 'Validation failed', details)

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      })
    })
  })
})
