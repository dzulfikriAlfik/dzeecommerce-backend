/**
 * Request ID middleware unit tests.
 *
 * Verifies that correlation IDs are generated for every request,
 * client-provided IDs are reused, and the ID propagates to both
 * `req.requestId` and the response header.
 */

import { jest } from '@jest/globals'
import type { Request, Response, NextFunction } from 'express'
import { requestIdMiddleware, REQUEST_ID_HEADER } from '../../src/middleware/request-id.middleware.js'

/** UUID v4 pattern. */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Create a minimal mock Express request.
 *
 * @param headers - Headers to include.
 * @returns Mock Request object.
 */
function createMockRequest(headers: Record<string, string | undefined> = {}): Request {
  return {
    headers,
    requestId: '',
  } as unknown as Request
}

/**
 * Create a minimal mock Express response.
 *
 * @returns Mock Response object with a setHeader spy.
 */
function createMockResponse(): Response {
  return {
    setHeader: jest.fn(),
  } as unknown as Response
}

describe('Request ID Middleware', () => {
  const next: NextFunction = jest.fn() as unknown as NextFunction

  beforeEach(() => {
    ;(next as jest.Mock).mockClear()
  })

  it('should generate a UUID v4 when no x-request-id header is provided', () => {
    const req = createMockRequest()
    const res = createMockResponse()

    requestIdMiddleware(req, res, next)

    expect(req.requestId).toMatch(UUID_V4_REGEX)
  })

  it('should reuse the client-provided x-request-id', () => {
    const clientId = 'my-custom-correlation-id'
    const req = createMockRequest({ [REQUEST_ID_HEADER]: clientId })
    const res = createMockResponse()

    requestIdMiddleware(req, res, next)

    expect(req.requestId).toBe(clientId)
  })

  it('should set the x-request-id header on the response', () => {
    const req = createMockRequest()
    const res = createMockResponse()

    requestIdMiddleware(req, res, next)

    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, req.requestId)
  })

  it('should set response header to the same value as req.requestId', () => {
    const clientId = 'echo-this-id'
    const req = createMockRequest({ [REQUEST_ID_HEADER]: clientId })
    const res = createMockResponse()

    requestIdMiddleware(req, res, next)

    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, clientId)
  })

  it('should call next() to continue the middleware chain', () => {
    const req = createMockRequest()
    const res = createMockResponse()

    requestIdMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should generate a new UUID when header is an empty string', () => {
    const req = createMockRequest({ [REQUEST_ID_HEADER]: '' })
    const res = createMockResponse()

    requestIdMiddleware(req, res, next)

    expect(req.requestId).toMatch(UUID_V4_REGEX)
  })

  it('should generate unique IDs for different requests', () => {
    const req1 = createMockRequest()
    const res1 = createMockResponse()
    const req2 = createMockRequest()
    const res2 = createMockResponse()

    requestIdMiddleware(req1, res1, next)
    requestIdMiddleware(req2, res2, next)

    expect(req1.requestId).not.toBe(req2.requestId)
  })
})
