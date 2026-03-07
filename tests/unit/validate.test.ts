/**
 * Validate middleware unit tests.
 *
 * Tests the Zod-based request validation factory, covering
 * successful parsing, field-level validation errors, and
 * non-Zod error passthrough.
 */

import { jest } from '@jest/globals'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate } from '../../src/middleware/validate.middleware.js'
import { ValidationError } from '../../src/utils/errors.js'

/**
 * Create a minimal mock Express request.
 *
 * @param overrides - Partial request properties.
 * @returns Mock Request object.
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request
}

describe('Validate Middleware', () => {
  const mockRes = {} as Response
  let mockNext: jest.Mock

  beforeEach(() => {
    mockNext = jest.fn()
  })

  describe('body validation (default target)', () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })

    it('should call next() when body is valid', () => {
      const req = createMockRequest({
        body: { email: 'test@example.com', name: 'John' },
      })
      const middleware = validate(schema)

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should replace req.body with parsed data', () => {
      const req = createMockRequest({
        body: { email: 'test@example.com', name: 'John', extraField: 'ignored' },
      })
      const middleware = validate(schema)

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      // Zod strips unknown fields by default
      expect(req.body).toEqual({ email: 'test@example.com', name: 'John' })
    })

    it('should call next with ValidationError on invalid body', () => {
      const req = createMockRequest({
        body: { email: 'not-an-email', name: '' },
      })
      const middleware = validate(schema)

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0]![0] as ValidationError
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.statusCode).toBe(422)
      expect(error.details).toBeDefined()
    })

    it('should include field-level error details', () => {
      const req = createMockRequest({
        body: { email: 'bad', name: '' },
      })
      const middleware = validate(schema)

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      const error = mockNext.mock.calls[0]![0] as ValidationError
      expect(error.details['email']).toBeDefined()
      expect(error.details['name']).toBeDefined()
    })

    it('should handle missing body fields', () => {
      const req = createMockRequest({ body: {} })
      const middleware = validate(schema)

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      const error = mockNext.mock.calls[0]![0] as ValidationError
      expect(error).toBeInstanceOf(ValidationError)
    })
  })

  describe('query validation', () => {
    const schema = z.object({
      page: z.coerce.number().int().positive(),
    })

    it('should validate req.query when target is query', () => {
      const req = createMockRequest({ query: { page: '1' } as unknown as Request['query'] })
      const middleware = validate(schema, 'query')

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should return ValidationError for invalid query', () => {
      const req = createMockRequest({ query: { page: 'abc' } as unknown as Request['query'] })
      const middleware = validate(schema, 'query')

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      const error = mockNext.mock.calls[0]![0] as ValidationError
      expect(error).toBeInstanceOf(ValidationError)
    })
  })

  describe('params validation', () => {
    const schema = z.object({
      id: z.string().uuid(),
    })

    it('should validate req.params when target is params', () => {
      const req = createMockRequest({
        params: { id: '550e8400-e29b-41d4-a716-446655440000' } as unknown as Request['params'],
      })
      const middleware = validate(schema, 'params')

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should return ValidationError for invalid params', () => {
      const req = createMockRequest({
        params: { id: 'not-a-uuid' } as unknown as Request['params'],
      })
      const middleware = validate(schema, 'params')

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      const error = mockNext.mock.calls[0]![0] as ValidationError
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.details['id']).toBeDefined()
    })
  })

  describe('non-Zod error passthrough', () => {
    it('should pass non-Zod errors directly to next()', () => {
      const throwingSchema = {
        parse: () => {
          throw new Error('Unexpected schema error')
        },
      } as unknown as z.ZodSchema

      const req = createMockRequest({ body: { any: 'data' } })
      const middleware = validate(throwingSchema)

      middleware(req, mockRes, mockNext as unknown as NextFunction)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0]![0] as Error
      expect(error).toBeInstanceOf(Error)
      expect(error).not.toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Unexpected schema error')
    })
  })
})
