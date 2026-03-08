/**
 * Authentication controller.
 *
 * @module controllers/auth
 */

import type { NextFunction, Request, Response } from 'express'
import {
  getClearRefreshCookieOptions,
  getRefreshCookieOptions,
  refreshTokenCookieName,
} from '../config/cookie.config.js'
import { sendSuccess } from '../utils/api-response.js'
import { UnauthorizedError } from '../utils/errors.js'
import { authService } from '../services/auth/auth.service.js'
import type { LoginInput, RegisterInput } from '../schemas/auth/auth.schema.js'

/**
 * Build request metadata for auth service operations.
 *
 * @param req Express request.
 * @returns Request metadata.
 */
function getAuthMetadata(req: Request): { userAgent?: string; ipAddress?: string } {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  }
}

/**
 * Register endpoint handler.
 *
 * @param req Express request.
 * @param res Express response.
 * @param next Express next function.
 * @returns Promise that resolves after response is sent.
 */
async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as RegisterInput
    const result = await authService.register(payload, getAuthMetadata(req))

    res.cookie(refreshTokenCookieName, result.refreshToken, getRefreshCookieOptions())

    sendSuccess(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      201,
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Login endpoint handler.
 *
 * @param req Express request.
 * @param res Express response.
 * @param next Express next function.
 * @returns Promise that resolves after response is sent.
 */
async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as LoginInput
    const result = await authService.login(payload, getAuthMetadata(req))

    res.cookie(refreshTokenCookieName, result.refreshToken, getRefreshCookieOptions())

    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Refresh endpoint handler.
 *
 * @param req Express request.
 * @param res Express response.
 * @param next Express next function.
 * @returns Promise that resolves after response is sent.
 */
async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[refreshTokenCookieName] as string | undefined

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token cookie is missing', 'MISSING_REFRESH_TOKEN')
    }

    const result = await authService.refresh(refreshToken)

    res.cookie(refreshTokenCookieName, result.refreshToken, getRefreshCookieOptions())

    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout endpoint handler.
 *
 * @param req Express request.
 * @param res Express response.
 * @param next Express next function.
 * @returns Promise that resolves after response is sent.
 */
async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[refreshTokenCookieName] as string | undefined

    await authService.logout(refreshToken)

    res.clearCookie(refreshTokenCookieName, getClearRefreshCookieOptions())

    sendSuccess(res, {
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
}

/** Authentication controller namespace. */
export const authController = {
  register,
  login,
  refresh,
  logout,
}
