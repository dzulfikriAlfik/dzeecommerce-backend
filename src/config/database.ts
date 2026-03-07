/**
 * Prisma database configuration and lifecycle helpers.
 *
 * This module centralises Prisma client creation, connection,
 * disconnection, and lightweight health checks.
 *
 * @module config/database
 */

import { PrismaClient } from '@prisma/client'
import { appConfig, dbConfig } from './app.config.js'
import { logger } from './logger.js'

/** Global Prisma singleton type for development hot-reload safety. */
interface GlobalWithPrisma {
  prisma?: PrismaClient
}

/** Global object with optional cached Prisma instance. */
const globalForPrisma = globalThis as GlobalWithPrisma

/**
 * Build a Prisma client with environment-aware logging.
 *
 * @returns Configured Prisma client instance.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: appConfig.isDevelopment ? ['error', 'warn'] : ['error'],
  })
}

/** Reusable Prisma client singleton. */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (!appConfig.isProduction) {
  globalForPrisma.prisma = prisma
}

/**
 * Establish a database connection for application startup.
 *
 * @returns A promise that resolves when the database is connected.
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect()

  logger.info('Database connected', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.name,
  })
}

/**
 * Close database connections for graceful shutdown.
 *
 * @returns A promise that resolves when all Prisma connections are closed.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  logger.info('Database disconnected')
}

/**
 * Perform a lightweight DB connectivity check.
 *
 * Executes `SELECT 1` and returns true when successful.
 *
 * @returns Whether the database is reachable.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name,
    })
    return false
  }
}
