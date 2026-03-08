/**
 * Authentication data access layer.
 *
 * @module repositories/auth
 */

import { Prisma, type RefreshToken, type Session, type User } from '@prisma/client'
import { prisma } from '../config/database.js'

/** User shape returned to auth services. */
export interface AuthUserRecord {
  id: string
  email: string
  passwordHash: string | null
  fullName: string | null
  isActive: boolean
}

/** Refresh-token record expanded with user and session. */
export interface RefreshTokenRecordWithRelations extends RefreshToken {
  user: User
  session: Session | null
}

/** Input required to create session and refresh-token records together. */
export interface CreateSessionWithRefreshInput {
  userId: string
  sessionId: string
  sessionTokenHash: string
  refreshTokenId: string
  refreshTokenHash: string
  expiresAt: Date
  userAgent?: string
  ipAddress?: string
}

/** Input required to rotate a refresh token. */
export interface RotateRefreshTokenInput {
  currentTokenId: string
  newTokenId: string
  userId: string
  sessionId: string | null
  newTokenHash: string
  newExpiresAt: Date
}

/**
 * Auth repository implementation.
 */
export class AuthRepository {
  /**
   * Find a user by email.
   *
   * @param email User email.
   * @returns User record or null.
   */
  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        isActive: true,
      },
    })
  }

  /**
   * Create a new user.
   *
   * @param data User creation payload.
   * @returns Newly created user.
   */
  async createUser(data: {
    email: string
    passwordHash: string
    fullName?: string
  }): Promise<AuthUserRecord> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        isActive: true,
      },
    })
  }

  /**
   * Resolve a role by key.
   *
   * @param key Role key.
   * @returns Role record or null.
   */
  async findRoleByKey(key: string): Promise<{ id: string } | null> {
    return prisma.role.findUnique({
      where: { key },
      select: { id: true },
    })
  }

  /**
   * Assign a role to a user if it does not already exist.
   *
   * @param userId User ID.
   * @param roleId Role ID.
   * @returns Promise that resolves when assignment is applied.
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {
        revokedAt: null,
        revokedById: null,
      },
      create: {
        userId,
        roleId,
      },
    })
  }

  /**
   * Create a session and its initial refresh token in one transaction.
   *
   * @param input Session and refresh-token input.
   * @returns Promise that resolves when records are stored.
   */
  async createSessionWithRefreshToken(input: CreateSessionWithRefreshInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: {
          id: input.sessionId,
          userId: input.userId,
          sessionTokenHash: input.sessionTokenHash,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
          expiresAt: input.expiresAt,
        },
      })

      await tx.refreshToken.create({
        data: {
          id: input.refreshTokenId,
          userId: input.userId,
          sessionId: input.sessionId,
          tokenHash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
        },
      })
    })
  }

  /**
   * Find a refresh token by its hash with joined user and session.
   *
   * @param tokenHash Hash of raw refresh token.
   * @returns Refresh-token record with relations, or null.
   */
  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecordWithRelations | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        session: true,
      },
    })
  }

  /**
   * Rotate refresh token by creating a replacement and revoking current token.
   *
   * @param input Rotation input.
   * @returns Created replacement token.
   */
  async rotateRefreshToken(input: RotateRefreshTokenInput): Promise<RefreshToken> {
    return prisma.$transaction(async (tx) => {
      const replacement = await tx.refreshToken.create({
        data: {
          id: input.newTokenId,
          userId: input.userId,
          sessionId: input.sessionId,
          tokenHash: input.newTokenHash,
          expiresAt: input.newExpiresAt,
        },
      })

      await tx.refreshToken.update({
        where: { id: input.currentTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: replacement.id,
        },
      })

      if (input.sessionId) {
        await tx.session.update({
          where: { id: input.sessionId },
          data: {
            lastSeenAt: new Date(),
            expiresAt: input.newExpiresAt,
          },
        })
      }

      return replacement
    })
  }

  /**
   * Revoke all session tokens and the session itself.
   *
   * @param sessionId Session ID.
   * @returns Promise that resolves once records are revoked.
   */
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const now = new Date()

      await tx.refreshToken.updateMany({
        where: {
          sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      })

      await tx.session.update({
        where: { id: sessionId },
        data: {
          revokedAt: now,
          lastSeenAt: now,
        },
      })
    })
  }

  /**
   * Revoke a refresh token by record ID.
   *
   * @param refreshTokenId Refresh-token ID.
   * @returns Promise that resolves once token is revoked.
   */
  async revokeRefreshTokenById(refreshTokenId: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { id: refreshTokenId },
        data: {
          revokedAt: new Date(),
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return
      }

      throw error
    }
  }
}

/** Shared auth repository instance. */
export const authRepository = new AuthRepository()
