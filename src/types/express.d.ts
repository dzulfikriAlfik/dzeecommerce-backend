/**
 * Express type augmentations.
 *
 * Extends the Express `Request` interface to include custom properties
 * that are attached by middleware (e.g. `requestId`).
 *
 * @module types/express
 */

declare global {
  namespace Express {
    interface Request {
      /** Unique correlation ID for request tracing. */
      requestId: string
    }
  }
}

export {}
