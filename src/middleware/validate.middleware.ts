/**
 * Request body/query/params validation middleware using Zod.
 *
 * Provides a generic factory that validates any part of the request
 * against a Zod schema and returns a structured `ValidationError` on failure.
 *
 * @module middleware/validate
 */

import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { ZodError } from 'zod'
import { ValidationError } from '../utils/errors.js'

/** Which part of the request to validate. */
type ValidationTarget = 'body' | 'query' | 'params'

/**
 * Create a validation middleware for the specified request target.
 *
 * @param schema - Zod schema to validate against.
 * @param target - Request property to validate (default: 'body').
 * @returns Express middleware.
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
): (req: Request, _res: Response, next: NextFunction) => void {
  /**
   * Validate the request target against the given Zod schema.
   *
   * @param req - Express request.
   * @param _res - Express response (unused).
   * @param next - Next middleware.
   */
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data: unknown = req[target]
      const parsed: unknown = schema.parse(data)

      // Replace the target with the parsed (and potentially transformed) data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(req as any)[target] = parsed

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {}
        for (const issue of error.issues) {
          const key = issue.path.join('.') || target
          if (!fieldErrors[key]) {
            fieldErrors[key] = []
          }
          fieldErrors[key].push(issue.message)
        }

        next(new ValidationError('Validation failed', fieldErrors))
        return
      }

      next(error)
    }
  }
}
