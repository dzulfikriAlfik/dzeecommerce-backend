/**
 * Shared test helpers.
 *
 * Provides utilities for creating the Express app in test mode
 * and common assertion helpers.
 *
 * @module tests/helpers
 */

import { createApp } from '../../src/app/express.js'
import type express from 'express'

/** Cached app instance for test suites. */
let app: express.Express | null = null

/**
 * Get or create the Express app configured for testing.
 *
 * Caches the instance so it is only created once per test run.
 *
 * @returns The Express app.
 */
export function getTestApp(): express.Express {
  if (!app) {
    app = createApp()
  }
  return app
}
