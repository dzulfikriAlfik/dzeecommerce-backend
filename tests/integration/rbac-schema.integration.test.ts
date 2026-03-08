import { execSync } from 'node:child_process'
import path from 'node:path'

import { Prisma } from '@prisma/client'

import { disconnectDatabase, prisma } from '../../src/config/database.js'
import { describeIfDatabase } from '../helpers/db.helper.js'

const describeDatabaseSuite = await describeIfDatabase()

/**
 * Assert that Prisma threw a unique-constraint violation.
 *
 * @param error Error thrown by Prisma operation.
 */
function assertUniqueConstraintError(error: unknown): void {
  expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError)

  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return
  }

  expect(error.code).toBe('P2002')
}

/**
 * Expect an operation to fail with a Prisma unique-constraint error.
 *
 * @param operation Promise representing the database operation.
 */
async function expectUniqueConstraintViolation(operation: Promise<unknown>): Promise<void> {
  try {
    await operation
    throw new Error('Expected a unique-constraint violation')
  } catch (error) {
    assertUniqueConstraintError(error)
  }
}

/**
 * Remove mutable records created by tests while preserving seeded catalog data.
 */
async function cleanupMutableRecords(): Promise<void> {
  await prisma.refreshToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
}

describeDatabaseSuite('Task B5 - RBAC schema integration', () => {
  beforeAll(() => {
    const projectRoot = path.resolve(process.cwd())

    execSync('npx prisma db push --schema prisma/schema.prisma --accept-data-loss --skip-generate', {
      cwd: projectRoot,
      env: {
        ...process.env,
      },
      stdio: 'pipe',
    })

    execSync('npm run prisma:seed', {
      cwd: projectRoot,
      env: {
        ...process.env,
      },
      stdio: 'pipe',
    })
  }, 60_000)

  beforeEach(async () => {
    await cleanupMutableRecords()
  })

  afterAll(async () => {
    await cleanupMutableRecords()
    await disconnectDatabase()
  })

  it('role seed test: should prepare default role and permission data', async () => {
    const roles = await prisma.role.findMany({
      orderBy: { key: 'asc' },
      include: { rolePermissions: true },
    })

    expect(roles.map((role) => role.key)).toEqual([
      'admin',
      'customer',
      'customer_support',
      'finance',
      'guest',
      'super_admin',
      'warehouse',
    ])

    const superAdmin = roles.find((role) => role.key === 'super_admin')

    expect(superAdmin).toBeDefined()
    expect(superAdmin?.rolePermissions.length).toBeGreaterThan(0)

    expect(await prisma.user.count()).toBe(0)
  })

  it('unique constraint tests: should reject duplicate identity and RBAC relations', async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: 'customer' } })
    const permission = await prisma.permission.findUniqueOrThrow({ where: { key: 'catalog.read' } })

    await expect(
      prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          passwordHash: 'hash_value_1',
        },
      }),
    ).resolves.toBeDefined()

    await expectUniqueConstraintViolation(
      prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          passwordHash: 'hash_value_2',
        },
      }),
    )

    await expectUniqueConstraintViolation(
      prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      }),
    )

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'duplicate@example.com' } })

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    })

    await expectUniqueConstraintViolation(
      prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      }),
    )
  })

  it('refresh token model tests: should store hashed token and enforce uniqueness', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'token-user@example.com',
        passwordHash: 'secure_password_hash',
      },
    })

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash: 'session_hash_123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const tokenHash = 'hashed_refresh_token_abc123'

    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    expect(refreshToken.tokenHash).toBe(tokenHash)

    await expectUniqueConstraintViolation(
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
    )
  })
})
