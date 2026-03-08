import { hashPassword, verifyPassword } from '../../src/services/auth/auth.service.js'

describe('Auth password hashing', () => {
  it('password hashing unit test: should hash plaintext and verify correctly', async () => {
    const plainPassword = 'StrongPass123!'
    const hashedPassword = await hashPassword(plainPassword)

    expect(hashedPassword).not.toBe(plainPassword)
    await expect(verifyPassword(plainPassword, hashedPassword)).resolves.toBe(true)
  })

  it('should reject invalid password against stored hash', async () => {
    const hashedPassword = await hashPassword('StrongPass123!')

    await expect(verifyPassword('WrongPassword123!', hashedPassword)).resolves.toBe(false)
  })
})
