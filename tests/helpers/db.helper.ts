/**
 * Database availability helper for integration tests.
 *
 * Probes PostgreSQL once per test run and caches the result.
 * Tests use {@link isDatabaseAvailable} to decide whether to run
 * or skip DB-dependent suites — no manual env var required.
 *
 * @module tests/helpers/db
 */

import { checkDatabaseConnection } from '../../src/config/database.js'

/** Cached probe result. `null` means not yet checked. */
let available: boolean | null = null

/**
 * Check whether the test database is reachable.
 *
 * The first call executes `SELECT 1` via Prisma; subsequent calls
 * return the cached boolean instantly.
 *
 * @returns Whether the database responded successfully.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  if (available !== null) {
    return available
  }

  try {
    available = await checkDatabaseConnection()
  } catch {
    available = false
  }

  return available
}

/**
 * Return the appropriate `describe` function based on DB availability.
 *
 * Use this at the top level of a test file:
 * ```ts
 * const dbDescribe = await describeIfDatabase()
 * dbDescribe('My DB suite', () => { ... })
 * ```
 *
 * @returns `describe` when DB is up, `describe.skip` otherwise.
 */
export async function describeIfDatabase(): Promise<typeof describe> {
  const dbUp = await isDatabaseAvailable()
  return dbUp ? describe : describe.skip
}
