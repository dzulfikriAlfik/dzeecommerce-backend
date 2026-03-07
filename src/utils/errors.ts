/**
 * Application-wide custom error classes.
 *
 * Every custom error extends `AppError` so that the centralised
 * error handler can distinguish operational errors from unexpected ones.
 *
 * @module utils/errors
 */

/**
 * Base application error.
 *
 * Operational errors the app can anticipate and handle gracefully.
 */
export class AppError extends Error {
  /** HTTP status code to return. */
  public readonly statusCode: number
  /** Machine-readable error code for clients. */
  public readonly code: string
  /** Whether this is a trusted operational error. */
  public readonly isOperational: boolean

  /**
   * Create a new AppError.
   *
   * @param message - Human-readable error description.
   * @param statusCode - HTTP status code.
   * @param code - Machine-readable error code.
   */
  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this)
  }
}

/**
 * 400 Bad Request.
 */
export class BadRequestError extends AppError {
  /**
   * @param message - Description of what was wrong with the request.
   * @param code - Machine-readable error code.
   */
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code)
  }
}

/**
 * 401 Unauthorized.
 */
export class UnauthorizedError extends AppError {
  /**
   * @param message - Description of the auth failure.
   * @param code - Machine-readable error code.
   */
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code)
  }
}

/**
 * 403 Forbidden.
 */
export class ForbiddenError extends AppError {
  /**
   * @param message - Description of why access is denied.
   * @param code - Machine-readable error code.
   */
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code)
  }
}

/**
 * 404 Not Found.
 */
export class NotFoundError extends AppError {
  /**
   * @param message - Description of the missing resource.
   * @param code - Machine-readable error code.
   */
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code)
  }
}

/**
 * 409 Conflict.
 */
export class ConflictError extends AppError {
  /**
   * @param message - Description of the conflict.
   * @param code - Machine-readable error code.
   */
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, code)
  }
}

/**
 * 422 Unprocessable Entity (validation errors).
 */
export class ValidationError extends AppError {
  /** Structured validation error details. */
  public readonly details: Record<string, string[]>

  /**
   * @param message - High-level validation failure message.
   * @param details - Field-level error descriptions.
   */
  constructor(message = 'Validation failed', details: Record<string, string[]> = {}) {
    super(message, 422, 'VALIDATION_ERROR')
    this.details = details
  }
}

/**
 * 429 Too Many Requests.
 */
export class TooManyRequestsError extends AppError {
  /**
   * @param message - Description of the rate limit violation.
   */
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}
