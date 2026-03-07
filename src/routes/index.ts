/**
 * Top-level route aggregator.
 *
 * Mounts the versioned API routers under their respective prefixes.
 * When a new API version is added it is registered here.
 *
 * @module routes
 */

import { Router } from 'express'
import v1Router from './v1/index.js'

const apiRouter = Router()

// ── Versioned API ──
apiRouter.use('/v1', v1Router)

export default apiRouter
