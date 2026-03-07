/**
 * Application configuration derived from validated environment variables.
 *
 * This module provides structured, typed config objects that the rest
 * of the application consumes. It never reads `process.env` directly —
 * all values come from the validated `env` singleton.
 *
 * @module config/app.config
 */

import { env, DATABASE_URL } from './env.js'

/** Application-level configuration. */
export const appConfig = {
  /** Current runtime environment. */
  nodeEnv: env.NODE_ENV,
  /** HTTP port for Express to bind to. */
  port: env.PORT,
  /** Whether the app is running in production. */
  isProduction: env.NODE_ENV === 'production',
  /** Whether the app is running in test mode. */
  isTest: env.NODE_ENV === 'test',
  /** Whether the app is running in development. */
  isDevelopment: env.NODE_ENV === 'development',
} as const

/** JWT configuration. */
export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
} as const

/** CORS configuration. */
export const corsConfig = {
  /** Allowed origin(s). Multiple origins separated by comma. */
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
} as const

/** Rate limiting configuration. */
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
} as const

/** Database configuration. */
export const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  name: env.DB_NAME,
  /** Full connection URL (also set on process.env.DATABASE_URL for Prisma). */
  url: DATABASE_URL,
} as const

/** Logging configuration. */
export const logConfig = {
  level: env.LOG_LEVEL,
} as const
