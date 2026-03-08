/**
 * Cookie configuration for authentication flows.
 *
 * @module config/cookie
 */

import type { CookieOptions } from 'express'
import { appConfig, jwtConfig } from './app.config.js'
import { parseDurationToMs } from '../utils/jwt.js'

/** Refresh-token cookie key. */
export const refreshTokenCookieName = 'refresh_token'

/**
 * Cookie options used when setting refresh tokens.
 *
 * @returns Express cookie options.
 */
export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: parseDurationToMs(jwtConfig.refreshExpiresIn),
  }
}

/**
 * Cookie options used when clearing refresh tokens.
 *
 * @returns Express cookie options.
 */
export function getClearRefreshCookieOptions(): CookieOptions {
  return {
    ...getRefreshCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  }
}
