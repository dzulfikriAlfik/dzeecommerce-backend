/**
 * Environment file loader.
 *
 * Loads the correct .env file based on NODE_ENV before any other module runs.
 * This file must be imported at the very top of the entry point.
 *
 * @module config/load-env
 */

import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Resolve and load the environment-specific .env file.
 *
 * Resolution order:
 * 1. `.env.{NODE_ENV}` (e.g. `.env.development`)
 * 2. `.env` as fallback
 *
 * @returns The NODE_ENV that was loaded.
 */
function loadEnvFile(): string {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development'
  const envFile = `.env.${nodeEnv}`
  const envPath = path.resolve(__dirname, '..', '..', envFile)

  dotenv.config({ path: envPath })

  return nodeEnv
}

loadEnvFile()
