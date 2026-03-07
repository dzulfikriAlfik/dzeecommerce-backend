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

import { fileURLToPath } from 'node:url'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Default platform roles for RBAC bootstrap. */
const DEFAULT_ROLES = [
  { key: 'guest', name: 'Guest', description: 'Unauthenticated public visitor' },
  { key: 'customer', name: 'Customer', description: 'Authenticated customer account' },
  {
    key: 'customer_support',
    name: 'Customer Support',
    description: 'Support operations for customer service workflows',
  },
  { key: 'warehouse', name: 'Warehouse', description: 'Inventory and fulfillment operations' },
  { key: 'finance', name: 'Finance', description: 'Payment and financial review operations' },
  { key: 'admin', name: 'Admin', description: 'General platform administration role' },
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Highest-privilege operational role for platform governance',
  },
] as const

/** Baseline permission catalog. */
const DEFAULT_PERMISSIONS = [
  { key: 'catalog.read', name: 'Read Catalog', description: 'Read product and category catalog' },
  { key: 'cart.manage.own', name: 'Manage Own Cart', description: 'Create and update own cart' },
  {
    key: 'order.manage.own',
    name: 'Manage Own Orders',
    description: 'Create and view own checkout and orders',
  },
  {
    key: 'support.manage.orders',
    name: 'Support Order Management',
    description: 'Support role can assist customer order handling',
  },
  {
    key: 'inventory.manage',
    name: 'Manage Inventory',
    description: 'Update stock and fulfillment inventory',
  },
  {
    key: 'finance.review.payments',
    name: 'Review Payments',
    description: 'Review and reconcile payment operations',
  },
  {
    key: 'admin.manage.catalog',
    name: 'Manage Catalog',
    description: 'Create and maintain product catalog entities',
  },
  {
    key: 'admin.manage.rbac',
    name: 'Manage RBAC',
    description: 'Manage roles, permissions, and role assignments',
  },
] as const

/** Role-to-permissions bootstrap matrix. */
const ROLE_PERMISSION_MAP: Readonly<Record<string, readonly string[]>> = {
  guest: ['catalog.read'],
  customer: ['catalog.read', 'cart.manage.own', 'order.manage.own'],
  customer_support: ['catalog.read', 'support.manage.orders'],
  warehouse: ['catalog.read', 'inventory.manage'],
  finance: ['catalog.read', 'finance.review.payments'],
  admin: ['catalog.read', 'admin.manage.catalog'],
  super_admin: [
    'catalog.read',
    'cart.manage.own',
    'order.manage.own',
    'support.manage.orders',
    'inventory.manage',
    'finance.review.payments',
    'admin.manage.catalog',
    'admin.manage.rbac',
  ],
}

/**
 * Seed default RBAC catalog records.
 *
 * @returns A promise that resolves when role and permission seeds complete.
 */
export async function seedDefaultRbacData(): Promise<void> {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description },
      create: role,
    })
  }

  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, description: permission.description },
      create: permission,
    })
  }

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } })

    for (const permissionKey of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } })

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
    }
  }
}

/**
 * Main seed function.
 *
 * @returns A promise that resolves when seeding is complete.
 */
export async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...')

  await prisma.systemMeta.upsert({
    where: { key: 'schema_version' },
    update: { value: '0.2.0' },
    create: { key: 'schema_version', value: '0.2.0' },
  })

  await seedDefaultRbacData()

  // eslint-disable-next-line no-console
  console.log('✅ Seeding complete')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
    .catch((e: unknown) => {
      // eslint-disable-next-line no-console
      console.error('❌ Seeding failed:', e)
      process.exit(1)
    })
    .finally(() => {
      void prisma.$disconnect()
    })
}
