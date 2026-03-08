/**
 * API v1 route aggregator.
 *
 * All v1 routes are registered here and mounted under `/api/v1`.
 * Each feature module exports its own router which is imported
 * and attached at the appropriate path.
 *
 * @module routes/v1
 */

import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'

const v1Router = Router()

// ── Public routes ──
v1Router.use('/health', healthRoutes)
v1Router.use('/auth', authRoutes)

// ── Future feature routes ──
// v1Router.use('/products', productRoutes)
// v1Router.use('/categories', categoryRoutes)
// v1Router.use('/cart', cartRoutes)
// v1Router.use('/checkout', checkoutRoutes)
// v1Router.use('/orders', orderRoutes)
// v1Router.use('/payments', paymentRoutes)
// v1Router.use('/notifications', notificationRoutes)
// v1Router.use('/webhooks', webhookRoutes)
// v1Router.use('/admin', adminRoutes)

export default v1Router
