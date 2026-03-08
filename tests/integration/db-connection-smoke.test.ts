import { checkDatabaseConnection, disconnectDatabase } from '../../src/config/database.js'
import { describeIfDatabase } from '../helpers/db.helper.js'

const describeDatabaseSuite = await describeIfDatabase()

describeDatabaseSuite('Database Connection Smoke Test', () => {
  it(
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
