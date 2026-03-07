/**
 * Standardised API response helpers.
 *
 * Every API response uses a consistent envelope so that clients can
 * rely on a single shape for both success and error responses.
 *
 * @module utils/api-response
 */

import type { Response } from 'express'

/** Shape of a successful API response. */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

/** Shape of an error API response. */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

/**
 * Send a standardised success response.
 *
 * @param res - Express response object.
 * @param data - Payload to return.
 * @param statusCode - HTTP status code (default 200).
 * @param meta - Optional metadata (pagination, etc.).
 * @returns The Express response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: ApiSuccessResponse<T> = { success: true, data }
  if (meta) {
    body.meta = meta
  }
  return res.status(statusCode).json(body)
}

/**
 * Send a standardised error response.
 *
 * @param res - Express response object.
 * @param statusCode - HTTP status code.
 * @param code - Machine-readable error code.
 * @param message - Human-readable error message.
 * @param details - Optional field-level validation errors.
 * @returns The Express response.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message },
  }
  if (details) {
    body.error.details = details
  }
  return res.status(statusCode).json(body)
}
