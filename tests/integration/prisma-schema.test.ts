import { execSync } from 'node:child_process'
import path from 'node:path'

describe('Prisma Schema Validation', () => {
  it('should validate prisma schema successfully', () => {
    const projectRoot = path.resolve(process.cwd())

    const output = execSync('npx prisma validate --schema prisma/schema.prisma', {
      cwd: projectRoot,
      env: {
        ...process.env,
      },
      stdio: 'pipe',
    }).toString()

    expect(output).toContain('The schema at prisma/schema.prisma is valid')
  }, 30_000)
})
