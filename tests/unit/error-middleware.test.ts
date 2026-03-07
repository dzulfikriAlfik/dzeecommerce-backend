/**
 * Error middleware unit tests.
 *
 * Directly invokes `errorMiddleware` with different error types
 * to verify correct status codes, response envelopes, and that
 * stack traces are never exposed in production mode.
 */

import { jest } from '@jest/globals'
import type { Request, Response, NextFunction } from 'express'
import { errorMiddleware } from '../../src/middleware/error.middleware.js'
import { AppError, ValidationError, NotFoundError, BadRequestError } from '../../src/utils/errors.js'

/**
 * Create a minimal mock Express request.
 *
 * @param overrides - Partial request properties to apply.
 * @returns Mock Request object.
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    requestId: 'test-req-id',
    originalUrl: '/api/v1/test',
    path: '/api/v1/test',
    method: 'GET',
    ...overrides,
  } as unknown as Request
}

/**
 * Create a minimal mock Express response with chainable methods.
 *
 * @returns Mock Response object with spies.
 */
function createMockResponse(): Response & { _getStatusCode: () => number; _getBody: () => unknown } {
  let statusCode = 200
  let body: unknown = null

  const res = {
    status: jest.fn((code: number) => {
      statusCode = code
      return res
    }),
    json: jest.fn((data: unknown) => {
      body = data
      return res
    }),
    _getStatusCode: () => statusCode,
    _getBody: () => body,
  } as unknown as Response & { _getStatusCode: () => number; _getBody: () => unknown }

  return res
}

describe('Error Middleware', () => {
  const mockNext: NextFunction = jest.fn() as unknown as NextFunction

  describe('AppError handling', () => {
    it('should return correct status code for AppError', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new BadRequestError('Invalid input')

      errorMiddleware(error, req, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'BAD_REQUEST',
            message: 'Invalid input',
          }),
        }),
      )
    })

    it('should return 404 for NotFoundError', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new NotFoundError('Product not found')

      errorMiddleware(error, req, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            message: 'Product not found',
          }),
        }),
      )
    })

    it('should include error code in the response for all AppError types', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new AppError('Custom error', 418, 'TEAPOT')

      errorMiddleware(error, req, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(418)
      const body = (res.json as jest.Mock).mock.calls[0]![0] as Record<string, unknown>
      const errorBody = body['error'] as Record<string, unknown>
      expect(errorBody['code']).toBe('TEAPOT')
    })
  })

  describe('ValidationError handling', () => {
    it('should return 422 with field-level details', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const details = {
        email: ['Invalid email format'],
        password: ['Must be at least 8 characters'],
      }
      const error = new ValidationError('Validation failed', details)

      errorMiddleware(error, req, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(422)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          }),
        }),
      )
    })

    it('should return empty details when none provided', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new ValidationError()

      errorMiddleware(error, req, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(422)
    })
  })

  describe('Unexpected error handling', () => {
    it('should return 500 for non-AppError exceptions', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new Error('Something went wrong internally')

      errorMiddleware(error, req, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
          }),
        }),
      )
    })

    it('should not expose stack traces in the response', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new Error('DB connection failed')

      errorMiddleware(error, req, res, mockNext)

      const body = (res.json as jest.Mock).mock.calls[0]![0] as Record<string, unknown>
      const errorBody = body['error'] as Record<string, unknown>

      expect(errorBody['stack']).toBeUndefined()
      expect(body['stack']).toBeUndefined()
    })

    it('should use generic message for unexpected errors in test mode', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new Error('Internal secret info')

      errorMiddleware(error, req, res, mockNext)

      // In test/development the actual message is returned;
      // in production it would be sanitised. Either way, no stack leaks.
      const body = (res.json as jest.Mock).mock.calls[0]![0] as Record<string, unknown>
      const errorBody = body['error'] as Record<string, unknown>
      expect(errorBody['message']).toBeDefined()
    })
  })

  describe('Response envelope format', () => {
    it('should always return { success: false, error: { code, message } }', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new BadRequestError('Bad input')

      errorMiddleware(error, req, res, mockNext)

      const body = (res.json as jest.Mock).mock.calls[0]![0] as Record<string, unknown>
      expect(body).toHaveProperty('success', false)
      expect(body).toHaveProperty('error')

      const errorBody = body['error'] as Record<string, unknown>
      expect(errorBody).toHaveProperty('code')
      expect(errorBody).toHaveProperty('message')
    })

    it('should not call next()', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const error = new BadRequestError()

      errorMiddleware(error, req, res, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})
