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

startServer()
