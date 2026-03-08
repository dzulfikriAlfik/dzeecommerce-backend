/**
 * Application entry point.
 *
 * This file is the first module executed. It:
 * 1. Loads the correct `.env.*` file
 * 2. Validates environment variables
 * 3. Boots the HTTP server
 *
 * @module index
 */

// Force env loading before anything else
import './config/load-env.js'

import { startServer } from './app/server.js'
import { connectDatabase, logger } from './config/index.js'

/**
 * Bootstrap the application runtime.
 *
 * Connects to database first, then starts HTTP server.
 *
 * @returns A promise that resolves when startup is complete.
 */
async function bootstrap(): Promise<void> {
	try {
		await connectDatabase()
		startServer()
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)

		logger.error('Application startup failed', { error: message })

		// Synchronous fallback so the user always sees something
		// eslint-disable-next-line no-console
		console.error(`\n❌ Application startup failed: ${message}\n`)

		// Give Winston time to flush async transports before exit
		setTimeout(() => {
			process.exit(1)
		}, 500)
	}
}

void bootstrap()
