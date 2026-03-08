/**
 * HTTP server bootstrap.
 *
 * Starts the Express server and registers graceful shutdown handlers.
 * This module is responsible for the lifecycle of the HTTP server only.
 *
 * @module app/server
 */

import type { Server } from 'node:http'
import { createApp } from './express.js'
import { appConfig, logger } from '../config/index.js'
import { disconnectDatabase } from '../config/database.js'

/** Reference to the running HTTP server for shutdown. */
let server: Server | null = null

/**
 * Start the HTTP server.
 *
 * @returns The running HTTP server instance.
 */
export function startServer(): Server {
  const app = createApp()

  server = app.listen(appConfig.port, () => {
    // Synchronous banner — always visible in the terminal
    // eslint-disable-next-line no-console
    console.log(
      `\n🚀 Server running on http://localhost:${String(appConfig.port)} | env: ${appConfig.nodeEnv} | pid: ${String(process.pid)}\n`,
    )

    logger.info('Server started', {
      host: 'localhost',
      port: appConfig.port,
      env: appConfig.nodeEnv,
      pid: process.pid,
    })
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${appConfig.port} is already in use`, { port: appConfig.port })
    } else {
      logger.error('Server error', { error: error.message, code: error.code })
    }
    process.exit(1)
  })

  // ── Graceful shutdown ──
  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`)

    if (server) {
      server.close(() => {
        logger.info('HTTP server closed')
        void disconnectDatabase()
          .catch((error: unknown) => {
            logger.error('Failed to disconnect database during shutdown', {
              error: error instanceof Error ? error.message : String(error),
            })
          })
          .finally(() => {
            process.exit(0)
          })
      })

      // Force exit after 10 s if connections are not drained
      setTimeout(() => {
        logger.warn('Forcefully shutting down after timeout')
        process.exit(1)
      }, 10_000).unref()
    }
  }

  process.on('SIGTERM', () => { shutdown('SIGTERM') })
  process.on('SIGINT', () => { shutdown('SIGINT') })

  // ── Unhandled rejection / exception safety net ──
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) })
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack })
    process.exit(1)
  })

  return server
}

/**
 * Get the currently running server instance.
 *
 * @returns The server instance, or null if not started.
 */
export function getServer(): Server | null {
  return server
}
