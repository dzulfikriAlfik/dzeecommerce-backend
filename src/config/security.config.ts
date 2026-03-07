/**
 * Security configuration for middleware defaults.
 *
 * Centralises helmet options, body size limits, and baseline
 * rate-limit profiles so they are easy to tune per environment.
 *
 * @module config/security.config
 */

import { appConfig, rateLimitConfig } from './app.config.js'

/** Baseline security configuration for HTTP middleware. */
export const securityConfig = {
  /** Helmet configuration. */
  helmet: {
    contentSecurityPolicy: appConfig.isProduction,
    crossOriginEmbedderPolicy: false,
  },

  /** Request payload limits. */
  body: {
    jsonLimit: '1mb',
    urlEncodedLimit: '1mb',
  },

  /** Rate-limit profiles. */
  rateLimit: {
    /** Global limiter for all API requests. */
    global: {
      maxRequests: rateLimitConfig.maxRequests,
      windowSeconds: Math.round(rateLimitConfig.windowMs / 1000),
    },
    /** Stricter limiter for authentication endpoints. */
    auth: {
      maxRequests: 10,
      windowSeconds: 60,
    },
    /** Slightly stricter limiter for webhook endpoints. */
    webhook: {
      maxRequests: 30,
      windowSeconds: 60,
    },
  },
} as const
