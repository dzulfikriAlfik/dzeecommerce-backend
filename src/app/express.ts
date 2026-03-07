/**
 * Express application factory.
 *
 * Assembles the Express app with all middleware, routes, and error handling.
 * The app is exported without calling `.listen()` so that it can be
 * imported independently for testing.
 *
 * @module app/express
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import { corsConfig } from '../config/app.config.js'
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  rateLimitMiddleware,
  notFoundMiddleware,
  errorMiddleware,
} from '../middleware/index.js'
import apiRouter from '../routes/index.js'

/**
 * Create and configure the Express application.
 *
 * @returns Fully configured Express app.
 */
export function createApp(): express.Express {
  const app = express()

  // ── Security headers ──
  app.use(helmet())

  // ── CORS ──
  app.use(cors(corsConfig))

  // ── Body parsers ──
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  // ── Cookies ──
  app.use(cookieParser())

  // ── Request tracing ──
  app.use(requestIdMiddleware)

  // ── Request logging ──
  app.use(requestLoggerMiddleware)

  // ── Global rate limiting ──
  app.use(rateLimitMiddleware)

  // ── API routes ──
  app.use('/api', apiRouter)

  // ── 404 handler (after all routes) ──
  app.use(notFoundMiddleware)

  // ── Centralised error handler (must be last) ──
  app.use(errorMiddleware)

  return app
}
