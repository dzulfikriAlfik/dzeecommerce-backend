import { checkDatabaseConnection, disconnectDatabase } from '../../src/config/database.js'

describe('Database Connection Smoke Test', () => {
  const shouldRunSmokeTest = process.env['RUN_DB_SMOKE_TEST'] === 'true'

  const testCase = shouldRunSmokeTest ? it : it.skip

  testCase(
    'should connect to PostgreSQL and execute a basic query',
    async () => {
      const connected = await checkDatabaseConnection()
      expect(connected).toBe(true)
    },
    30_000,
  )

  afterAll(async () => {
    await disconnectDatabase()
  })
})
