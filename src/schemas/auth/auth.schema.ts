/**
 * Authentication request schemas.
 *
 * @module schemas/auth
 */

import { z } from 'zod'

/** Register request payload schema. */
export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
})

/** Login request payload schema. */
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

/** Register request body type. */
export type RegisterInput = z.infer<typeof registerSchema>

/** Login request body type. */
export type LoginInput = z.infer<typeof loginSchema>
