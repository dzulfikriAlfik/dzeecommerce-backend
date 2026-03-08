/**
 * JWT helpers for access and refresh token lifecycle.
 *
 * @module utils/jwt
 */

import jwt, { type SignOptions } from 'jsonwebtoken'
import { jwtConfig } from '../config/app.config.js'

/** Access token payload shape. */
export interface AccessTokenPayload {
  sub: string
  email: string
  type: 'access'
}

/** Refresh token payload shape. */
export interface RefreshTokenPayload {
  sub: string
  sessionId: string
  tokenId: string
  type: 'refresh'
}

/**
 * Parse a duration string (e.g. `15m`, `7d`) into milliseconds.
 *
 * Supports units: `s`, `m`, `h`, `d`.
 *
 * @param duration Duration string.
 * @returns Duration in milliseconds.
 */
export function parseDurationToMs(duration: string): number {
  const numericSeconds = Number(duration)

  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return numericSeconds * 1000
  }

  const matched = /^(\d+)([smhd])$/.exec(duration.trim())

  if (!matched) {
    throw new Error(`Unsupported duration format: ${duration}`)
  }

  const amount = Number(matched[1])
  const unit = matched[2] as 's' | 'm' | 'h' | 'd'

  const unitToMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  const multiplier = unitToMs[unit]

  if (multiplier === undefined) {
    throw new Error(`Unsupported duration unit: ${unit}`)
  }

  return amount * multiplier
}

/**
 * Build a date representing access-token expiry from now.
 *
 * @returns Access-token expiration date.
 */
export function getAccessTokenExpiresAt(): Date {
  return new Date(Date.now() + parseDurationToMs(jwtConfig.accessExpiresIn))
}

/**
 * Build a date representing refresh-token expiry from now.
 *
 * @returns Refresh-token expiration date.
 */
export function getRefreshTokenExpiresAt(): Date {
  return new Date(Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn))
}

/**
 * Sign an access token.
 *
 * @param payload Access-token claims.
 * @returns Signed JWT string.
 */
export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  const claims: AccessTokenPayload = {
    ...payload,
    type: 'access',
  }

  const options: SignOptions = {
    expiresIn: jwtConfig.accessExpiresIn as SignOptions['expiresIn'],
  }

  return jwt.sign(claims, jwtConfig.accessSecret, options)
}

/**
 * Sign a refresh token.
 *
 * @param payload Refresh-token claims.
 * @returns Signed JWT string.
 */
export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  const claims: RefreshTokenPayload = {
    ...payload,
    type: 'refresh',
  }

  const options: SignOptions = {
    expiresIn: jwtConfig.refreshExpiresIn as SignOptions['expiresIn'],
  }

  return jwt.sign(claims, jwtConfig.refreshSecret, options)
}

/**
 * Verify and decode a refresh token.
 *
 * @param token Raw refresh token.
 * @returns Decoded refresh-token payload.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, jwtConfig.refreshSecret) as RefreshTokenPayload
}
