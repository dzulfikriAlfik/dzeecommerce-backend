/**
 * Authentication business logic.
 *
 * @module services/auth
 */

import { createHash, randomUUID } from 'node:crypto'
import argon2 from 'argon2'
import { authRepository, type AuthUserRecord } from '../../repositories/auth.repository.js'
import { ConflictError, UnauthorizedError } from '../../utils/errors.js'
import {
  getRefreshTokenExpiresAt,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js'

/** Input used to register a new user. */
export interface RegisterUserInput {
  email: string
  password: string
  fullName?: string
}

/** Input used to login a user. */
export interface LoginUserInput {
  email: string
  password: string
}

/** Request metadata used for session tracking. */
export interface AuthRequestMetadata {
  userAgent?: string
  ipAddress?: string
}

/** Auth response containing tokens and user profile data. */
export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    fullName: string | null
  }
}

/**
 * Hash a password with Argon2id.
 *
 * @param password Raw password.
 * @returns Password hash.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  })
}

/**
 * Verify password against Argon2 hash.
 *
 * @param password Raw password.
 * @param hashedPassword Stored password hash.
 * @returns Whether the password matches.
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return argon2.verify(hashedPassword, password)
}

/**
 * Hash token material with SHA-256 for DB persistence.
 *
 * @param rawToken Raw token value.
 * @returns Hex hash.
 */
function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/**
 * Normalize email for identity lookups and uniqueness.
 *
 * @param email Raw email.
 * @returns Normalized email.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Issue a new access+refresh token pair and persist rotation records.
 *
 * @param user Authenticated user.
 * @param metadata Request metadata.
 * @returns Auth result.
 */
async function issueTokenPair(
  user: Pick<AuthUserRecord, 'id' | 'email' | 'fullName'>,
  metadata: AuthRequestMetadata,
): Promise<AuthResult> {
  const sessionId = randomUUID()
  const refreshTokenId = randomUUID()
  const expiresAt = getRefreshTokenExpiresAt()

  const refreshToken = signRefreshToken({
    sub: user.id,
    sessionId,
    tokenId: refreshTokenId,
  })

  await authRepository.createSessionWithRefreshToken({
    userId: user.id,
    sessionId,
    sessionTokenHash: hashToken(`${sessionId}:${randomUUID()}`),
    refreshTokenId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  })

  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
    }),
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  }
}

/**
 * Authentication service.
 */
export class AuthService {
  /**
   * Register a new user and issue auth tokens.
   *
   * @param input Register input payload.
   * @param metadata Request metadata.
   * @returns Auth result.
   */
  async register(input: RegisterUserInput, metadata: AuthRequestMetadata): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(input.email)
    const existingUser = await authRepository.findUserByEmail(normalizedEmail)

    if (existingUser) {
      throw new ConflictError('Email is already registered', 'EMAIL_ALREADY_REGISTERED')
    }

    const passwordHash = await hashPassword(input.password)

    const user = await authRepository.createUser({
      email: normalizedEmail,
      passwordHash,
      fullName: input.fullName,
    })

    const customerRole = await authRepository.findRoleByKey('customer')

    if (customerRole) {
      await authRepository.assignRoleToUser(user.id, customerRole.id)
    }

    return issueTokenPair(user, metadata)
  }

  /**
   * Login user and issue fresh auth tokens.
   *
   * @param input Login input payload.
   * @param metadata Request metadata.
   * @returns Auth result.
   */
  async login(input: LoginUserInput, metadata: AuthRequestMetadata): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(input.email)
    const user = await authRepository.findUserByEmail(normalizedEmail)

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive', 'ACCOUNT_INACTIVE')
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    return issueTokenPair(user, metadata)
  }

  /**
   * Rotate refresh token and issue a new access token pair.
   *
   * @param rawRefreshToken Raw refresh token from cookie.
   * @returns New auth result.
   */
  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const decoded = verifyRefreshToken(rawRefreshToken)

    const storedToken = await authRepository.findRefreshTokenByHash(hashToken(rawRefreshToken))

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN')
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked', 'REFRESH_TOKEN_REVOKED')
    }

    if (storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED')
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Account is inactive', 'ACCOUNT_INACTIVE')
    }

    if (storedToken.id !== decoded.tokenId || storedToken.sessionId !== decoded.sessionId) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN')
    }

    const newRefreshTokenId = randomUUID()
    const newRefreshToken = signRefreshToken({
      sub: storedToken.userId,
      sessionId: decoded.sessionId,
      tokenId: newRefreshTokenId,
    })
    const newExpiresAt = getRefreshTokenExpiresAt()

    await authRepository.rotateRefreshToken({
      currentTokenId: storedToken.id,
      newTokenId: newRefreshTokenId,
      userId: storedToken.userId,
      sessionId: storedToken.sessionId,
      newTokenHash: hashToken(newRefreshToken),
      newExpiresAt,
    })

    return {
      accessToken: signAccessToken({
        sub: storedToken.user.id,
        email: storedToken.user.email,
      }),
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        fullName: storedToken.user.fullName,
      },
    }
  }

  /**
   * Logout by revoking session-linked refresh tokens.
   *
   * @param rawRefreshToken Optional raw refresh token from cookie.
   * @returns Promise that resolves once invalidation is attempted.
   */
  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) {
      return
    }

    try {
      const storedToken = await authRepository.findRefreshTokenByHash(hashToken(rawRefreshToken))

      if (!storedToken) {
        return
      }

      if (storedToken.sessionId) {
        await authRepository.revokeSession(storedToken.sessionId)
        return
      }

      await authRepository.revokeRefreshTokenById(storedToken.id)
    } catch {
      // Logout should remain best-effort and always clear client cookie.
    }
  }
}

/** Shared auth service instance. */
export const authService = new AuthService()
