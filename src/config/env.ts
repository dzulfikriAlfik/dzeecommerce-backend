/**
 * Centralized environment configuration with Zod validation.
 *
 * All environment variables used by the application are declared,
 * validated, and exported from this single module.
 * If a required variable is missing or invalid, the process will
 * exit immediately with a descriptive error.
 *
 * @module config/env
 */

import './load-env.js'

import { z } from 'zod'

/**
 * Schema definition for all required environment variables.
 * Add new variables here when the application needs them.
 */
const envSchema = z.object({
  // ── Application ──
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // ── Database ──
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),

  // ── CORS ──
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),

  // ── JWT ──
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── Logging ──
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly', 'silent'])
    .default('info'),

  // ── Rate Limiting ──
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
})

/** Inferred type from the environment schema. */
export type Env = z.infer<typeof envSchema>

/**
 * Parse and validate environment variables.
 *
 * @returns Validated and typed environment object.
 * @throws Exits the process if validation fails.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:')
    // eslint-disable-next-line no-console
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }

  return result.data
}

/** Validated environment configuration singleton. */
export const env: Env = validateEnv()

/**
 * Construct the full DATABASE_URL from individual DB_* variables.
 *
 * This is required by Prisma which reads DATABASE_URL from process.env.
 *
 * @returns PostgreSQL connection string.
 */
function buildDatabaseUrl(): string {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = env
  const credentials = DB_PASSWORD ? `${DB_USER}:${DB_PASSWORD}` : DB_USER
  return `postgresql://${credentials}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
}

/** Full database connection URL built from individual DB_* env vars. */
export const DATABASE_URL: string = buildDatabaseUrl()

// Prisma reads DATABASE_URL directly from process.env
process.env.DATABASE_URL = DATABASE_URL
