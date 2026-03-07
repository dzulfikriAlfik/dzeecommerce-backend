# Auth and RBAC Schema (Task B5)

## Goal
Establish the database foundation for identity and role-based access control (RBAC).

## Scope
This task introduces schema-level models only:
- user identities
- sessions
- refresh tokens
- roles
- permissions
- role-permission mapping
- user-role mapping

Authentication endpoints and authorization middleware are implemented in later tasks.

## Models introduced
- `users`
- `sessions`
- `refresh_tokens`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

## Default RBAC seed data
The seed script prepares baseline role and permission records without creating any default user credentials.

Default roles:
- `guest`
- `customer`
- `customer_support`
- `warehouse`
- `finance`
- `admin`
- `super_admin`

## Role documentation

### guest
- Can do:
  - read public catalog data
- Cannot do:
  - authenticate as a user
  - manage cart, checkout, orders, inventory, finance, or admin operations

### customer
- Can do:
  - read catalog
  - manage own cart
  - manage own orders and checkout
- Cannot do:
  - manage other users’ resources
  - perform support, warehouse, finance, or admin actions

### customer_support
- Can do:
  - read catalog
  - perform support order-management workflows (as allowed by policy)
- Cannot do:
  - perform warehouse stock updates
  - perform finance settlement operations
  - manage RBAC configuration

### warehouse
- Can do:
  - read catalog
  - manage inventory and fulfillment-related operations
- Cannot do:
  - process finance actions
  - manage RBAC configuration

### finance
- Can do:
  - read catalog
  - review/reconcile payment and finance workflows
- Cannot do:
  - manage inventory directly
  - manage RBAC configuration

### admin
- Can do:
  - read catalog
  - manage catalog entities
- Cannot do:
  - automatically bypass all security controls
  - use super-admin-only RBAC governance permissions by default

### super_admin
- Can do:
  - perform full baseline operational permissions from seeded matrix
  - manage RBAC configuration
- Cannot do:
  - bypass auditing requirements for sensitive operations

## Security review
- Refresh tokens are stored as `token_hash` (hashed representation only).
- Session tokens are stored as `session_token_hash`.
- No default admin or super-admin credentials are seeded.
- Role assignment records include assignment/revocation metadata fields for auditability (`assigned_by_id`, `revoked_by_id`, `assigned_at`, `revoked_at`).
- Uniqueness constraints prevent duplicate identities and duplicate role/permission bindings.

## Notes
- This task provides schema and seed groundwork.
- Enforcement logic is implemented in upcoming authentication and authorization tasks.
