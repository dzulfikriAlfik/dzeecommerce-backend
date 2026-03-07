/**
 * Logger redaction unit tests.
 *
 * Verifies that the `redact` function replaces sensitive fields
 * with '[REDACTED]' at any nesting depth, while leaving safe
 * fields intact.
 */

import { redact, REDACTED_FIELDS } from '../../src/config/logger.js'

describe('Logger Redaction', () => {
  describe('redact()', () => {
    it('should return null/undefined as-is', () => {
      expect(redact(null)).toBeNull()
      expect(redact(undefined)).toBeUndefined()
    })

    it('should return primitives as-is', () => {
      expect(redact('hello')).toBe('hello')
      expect(redact(42)).toBe(42)
      expect(redact(true)).toBe(true)
    })

    it('should redact top-level sensitive fields', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        token: 'abc.def.ghi',
      }

      const result = redact(input) as Record<string, unknown>

      expect(result.username).toBe('john')
      expect(result.password).toBe('[REDACTED]')
      expect(result.token).toBe('[REDACTED]')
    })

    it('should redact all known sensitive field names', () => {
      const input: Record<string, string> = {}
      for (const field of REDACTED_FIELDS) {
        input[field] = 'sensitive-value'
      }
      input['safeField'] = 'visible'

      const result = redact(input) as Record<string, unknown>

      for (const field of REDACTED_FIELDS) {
        expect(result[field]).toBe('[REDACTED]')
      }
      expect(result['safeField']).toBe('visible')
    })

    it('should redact nested objects recursively', () => {
      const input = {
        user: {
          email: 'john@test.com',
          password: 'secret',
          profile: {
            name: 'John',
            creditCard: '4111-1111-1111-1111',
          },
        },
      }

      const result = redact(input) as Record<string, Record<string, unknown>>
      const user = result['user']!

      expect(user['email']).toBe('john@test.com')
      expect(user['password']).toBe('[REDACTED]')

      const profile = user['profile'] as Record<string, unknown>
      expect(profile.name).toBe('John')
      expect(profile.creditCard).toBe('[REDACTED]')
    })

    it('should redact sensitive fields inside arrays', () => {
      const input = [
        { name: 'Alice', token: 'abc' },
        { name: 'Bob', secret: 'xyz' },
      ]

      const result = redact(input) as Array<Record<string, unknown>>

      expect(result[0]!.name).toBe('Alice')
      expect(result[0]!.token).toBe('[REDACTED]')
      expect(result[1]!.name).toBe('Bob')
      expect(result[1]!.secret).toBe('[REDACTED]')
    })

    it('should not mutate the original object', () => {
      const input = { password: 'secret', name: 'test' }
      const original = { ...input }

      redact(input)

      expect(input).toEqual(original)
    })

    it('should handle empty objects', () => {
      expect(redact({})).toEqual({})
    })

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              authorization: 'Bearer token123',
              data: 'safe',
            },
          },
        },
      }

      const result = redact(input) as Record<string, unknown>
      const level3 = (
        (result.level1 as Record<string, unknown>).level2 as Record<string, unknown>
      ).level3 as Record<string, unknown>

      expect(level3.authorization).toBe('[REDACTED]')
      expect(level3.data).toBe('safe')
    })

    it('should redact cookie and authorization header fields', () => {
      const input = {
        headers: {
          authorization: 'Bearer eyJhbGciOi...',
          cookie: 'session=abc123; refreshToken=xyz',
          'content-type': 'application/json',
        },
      }

      const result = redact(input) as Record<string, Record<string, unknown>>
      const headers = result['headers']!

      expect(headers['authorization']).toBe('[REDACTED]')
      expect(headers['cookie']).toBe('[REDACTED]')
      expect(headers['content-type']).toBe('application/json')
    })
  })

  describe('REDACTED_FIELDS', () => {
    it('should include critical security fields', () => {
      const expectedFields = [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'authorization',
        'cookie',
        'secret',
        'creditCard',
        'cardNumber',
        'cvv',
      ]

      for (const field of expectedFields) {
        expect(REDACTED_FIELDS.has(field)).toBe(true)
      }
    })
  })
})
