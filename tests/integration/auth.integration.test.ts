import { execSync } from 'node:child_process'
import path from 'node:path'

import request from 'supertest'

import { disconnectDatabase, prisma } from '../../src/config/database.js'
import { hashPassword } from '../../src/services/auth/auth.service.js'
import { getTestApp } from '../helpers/app.helper.js'
import { describeIfDatabase } from '../helpers/db.helper.js'

const describeDatabaseSuite = await describeIfDatabase()

/**
 * Extract refresh-token cookie value from set-cookie header array.
 *
 * @param setCookieHeader Response set-cookie header.
 * @returns Raw cookie pair and token value.
 */
function extractRefreshCookie(setCookieHeader: string[] | undefined): {
  rawCookie: string
  tokenValue: string
} {
  if (!setCookieHeader || setCookieHeader.length === 0) {
    throw new Error('Missing set-cookie header')
  }

  const refreshCookie = setCookieHeader.find((cookie) => cookie.startsWith('refresh_token='))

  if (!refreshCookie) {
    throw new Error('Missing refresh_token cookie')
  }

  const [rawPair] = refreshCookie.split(';')

  if (!rawPair) {
    throw new Error('Invalid refresh cookie')
  }

  const tokenValue = rawPair.slice('refresh_token='.length)

  if (!tokenValue) {
    throw new Error('Missing refresh token value')
  }

  return {
    rawCookie: rawPair,
    tokenValue,
  }
}

/**
 * Normalize set-cookie header into a string array.
 *
 * @param value Header value.
 * @returns Cookie string array.
 */
function toCookieArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

/**
 * Remove mutable identity/session records created by auth integration tests.
 */
async function cleanupAuthRecords(): Promise<void> {
  await prisma.refreshToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
}

describeDatabaseSuite('Task B6 - Authentication integration', () => {
  const app = getTestApp()

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
    await cleanupAuthRecords()
  })

  afterAll(async () => {
    await cleanupAuthRecords()
    await disconnectDatabase()
  })

  it('register integration test: should create user and issue tokens', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'register@example.com',
        password: 'StrongPass123!',
        fullName: 'Register User',
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      success: true,
      data: {
        accessToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'register@example.com',
          fullName: 'Register User',
        },
      },
    })

    const setCookie = response.headers['set-cookie'] as string[] | undefined

    expect(setCookie).toBeDefined()
    expect(setCookie?.join(';')).toContain('refresh_token=')
    expect(setCookie?.join(';')).toContain('HttpOnly')

    const storedUser = await prisma.user.findUnique({
      where: { email: 'register@example.com' },
    })

    expect(storedUser).toBeDefined()
    expect(storedUser?.passwordHash).toBeDefined()
    expect(storedUser?.passwordHash).not.toBe('StrongPass123!')
  })

  it('login integration test: should authenticate existing user and set refresh cookie', async () => {
    const password = 'StrongPass123!'
    await prisma.user.create({
      data: {
        email: 'login@example.com',
        passwordHash: await hashPassword(password),
        fullName: 'Login User',
      },
    })

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password,
      })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      success: true,
      data: {
        accessToken: expect.any(String),
        user: {
          email: 'login@example.com',
          fullName: 'Login User',
        },
      },
    })

    const setCookie = response.headers['set-cookie'] as string[] | undefined

    expect(setCookie).toBeDefined()
    expect(setCookie?.join(';')).toContain('refresh_token=')
    expect(setCookie?.join(';')).toContain('HttpOnly')
  })

  it('refresh rotation test: should rotate refresh token and reject previous token', async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'refresh@example.com',
        password: 'StrongPass123!',
        fullName: 'Refresh User',
      })

    const firstCookie = extractRefreshCookie(toCookieArray(registerResponse.headers['set-cookie']))

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstCookie.rawCookie)

    expect(refreshResponse.status).toBe(200)

    const rotatedCookie = extractRefreshCookie(toCookieArray(refreshResponse.headers['set-cookie']))

    expect(rotatedCookie.tokenValue).not.toBe(firstCookie.tokenValue)

    const replayResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstCookie.rawCookie)

    expect(replayResponse.status).toBe(401)
    expect(replayResponse.body).toMatchObject({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_REVOKED',
      },
    })
  })

  it('logout invalidation test: should revoke refresh token and block future refresh', async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'logout@example.com',
        password: 'StrongPass123!',
        fullName: 'Logout User',
      })

    const issuedCookie = extractRefreshCookie(toCookieArray(registerResponse.headers['set-cookie']))

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', issuedCookie.rawCookie)

    expect(logoutResponse.status).toBe(200)
    expect(logoutResponse.body).toMatchObject({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    })
    expect(toCookieArray(logoutResponse.headers['set-cookie']).join(';')).toContain('refresh_token=;')

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', issuedCookie.rawCookie)

    expect(refreshAfterLogout.status).toBe(401)
    expect(refreshAfterLogout.body).toMatchObject({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_REVOKED',
      },
    })
  })
})
