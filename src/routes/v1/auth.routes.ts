/**
 * Authentication routes.
 *
 * @module routes/v1/auth
 */

import { Router } from 'express'
import { authController } from '../../controllers/auth.controller.js'
import { authRateLimitMiddleware, validate } from '../../middleware/index.js'
import { loginSchema, registerSchema } from '../../schemas/auth/auth.schema.js'

const authRoutes = Router()

authRoutes.post('/register', authRateLimitMiddleware, validate(registerSchema), authController.register)
authRoutes.post('/login', authRateLimitMiddleware, validate(loginSchema), authController.login)
authRoutes.post('/refresh', authRateLimitMiddleware, authController.refresh)
authRoutes.post('/logout', authRateLimitMiddleware, authController.logout)

export default authRoutes
