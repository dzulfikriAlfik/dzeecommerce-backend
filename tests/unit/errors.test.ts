import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
} from '../../src/utils/errors.js'

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('test error', 500, 'TEST_ERROR')

      expect(error.message).toBe('test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.isOperational).toBe(true)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('BadRequestError', () => {
    it('should default to 400 status', () => {
      const error = new BadRequestError()
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BAD_REQUEST')
    })
  })

  describe('UnauthorizedError', () => {
    it('should default to 401 status', () => {
      const error = new UnauthorizedError()
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('ForbiddenError', () => {
    it('should default to 403 status', () => {
      const error = new ForbiddenError()
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
    })
  })

  describe('NotFoundError', () => {
    it('should default to 404 status', () => {
      const error = new NotFoundError()
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('ConflictError', () => {
    it('should default to 409 status', () => {
      const error = new ConflictError()
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
    })
  })

  describe('ValidationError', () => {
    it('should default to 422 status with details', () => {
      const details = { email: ['Invalid email format'] }
      const error = new ValidationError('Validation failed', details)

      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })
  })

  describe('TooManyRequestsError', () => {
    it('should default to 429 status', () => {
      const error = new TooManyRequestsError()
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('TOO_MANY_REQUESTS')
    })
  })
})
