/**
 * Winston logger configuration.
 *
 * Provides a centralized, production-grade JSON logger that:
 * - writes combined logs and error-only logs to `/logs`
 * - redacts sensitive fields (passwords, tokens, cookies, authorization)
 * - outputs colourised text in development for readability
 * - is completely silent during tests to keep output clean
 *
 * @module config/logger
 */

import winston from 'winston'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logConfig, appConfig } from './app.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs')

// ── Sensitive field redaction ──

/** Fields whose values must never appear in logs. */
const REDACTED_FIELDS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'creditCard',
  'cardNumber',
  'cvv',
])

/**
 * Recursively redact sensitive fields from a log object.
 *
 * @param obj - The object to redact.
 * @returns A shallow-redacted copy of the object.
 */
function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(redact)
  }

  const redacted: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_FIELDS.has(key)) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redact(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

/** Custom format that redacts sensitive data from log messages. */
const redactFormat = winston.format((info) => {
  return redact(info) as winston.Logform.TransformableInfo
})

// ── Transports ──

const transports: winston.transport[] = []

if (appConfig.isTest) {
  // Silent during tests
  transports.push(new winston.transports.Console({ silent: true }))
} else {
  // File transports — always JSON
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  )

  // Console transport — colourised in dev, JSON in production
  if (appConfig.isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
            return `${String(timestamp)} [${level}]: ${String(message)}${metaStr}`
          }),
        ),
      }),
    )
  } else {
    transports.push(new winston.transports.Console())
  }
}

// ── Logger instance ──

/**
 * Application-wide logger instance.
 *
 * Usage:
 * ```ts
 * import { logger } from '@/config/logger.js'
 * logger.info('Server started', { port: 4000 })
 * logger.error('Payment failed', { orderId, error })
 * ```
 */
export const logger: winston.Logger = winston.createLogger({
  level: logConfig.level,
  format: winston.format.combine(
    redactFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'dzeecommerce-backend' },
  transports,
  // Do not exit on uncaught errors — let the process manager handle restarts
  exitOnError: false,
})
