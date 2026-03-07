/**
 * Database seed script.
 *
 * Run with: `npm run prisma:seed`
 *
 * Seeds baseline data required for the application to function.
 * Currently inserts a system_meta version record.
 *
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Main seed function.
 *
 * @returns A promise that resolves when seeding is complete.
 */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...')

  await prisma.systemMeta.upsert({
    where: { key: 'schema_version' },
    update: { value: '0.1.0' },
    create: { key: 'schema_version', value: '0.1.0' },
  })

  // eslint-disable-next-line no-console
  console.log('✅ Seeding complete')
}

main()
  .catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
