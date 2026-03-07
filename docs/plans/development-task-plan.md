# Dzeecommerce Backend Development Task Plan

## Scope
This document defines the incremental backend development plan for the production-grade e-commerce platform.

## Global rules for every task
Each task must be:
- incremental
- small and safe
- testable
- non-breaking to previous code

Each task must include:
- lint
- typecheck
- tests
- build validation
- security review
- feature documentation update
- role documentation:
  - roles involved
  - what each role can do
  - what each role cannot do

## Roles to document in feature documentation
- guest
- customer
- customer_support
- warehouse
- finance
- admin
- super_admin

# Phase 1 — Backend foundation

## Task B1 — Backend project scaffold
### Goal
Initialize the Node.js + Express + strict TypeScript backend with versioned API routing.
### Files to create
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/app/server.ts`
- `src/app/express.ts`
- `src/routes/index.ts`
- `src/routes/v1/index.ts`
- `src/routes/v1/health.routes.ts`
- `src/config/env.ts`
- `src/config/app.config.ts`
- `src/config/cors.config.ts`
- `.env.development`
- `.env.production`
- `.env.test`
- `README.md`
### Expected output
- Backend starts successfully
- `/api/v1/health` returns success
- Strict TypeScript enabled
- Environment loading is centralized
### Tests to implement
- Health endpoint integration test
- Environment validation unit test
### Code quality checks
- lint
- typecheck
- unit tests
- integration tests
- build
### Security considerations
- validate env at startup
- no hardcoded secrets
- request body size limits
- CORS allowlist only

## Task B2 — Logging and error handling baseline
### Goal
Add structured logging and centralized error handling.
### Files to create
- `src/config/logger.ts`
- `src/middleware/error.middleware.ts`
- `src/middleware/request-id.middleware.ts`
- `src/middleware/not-found.middleware.ts`
- `src/utils/api-response.ts`
- `logs/.gitkeep`
### Expected output
- Winston logs are written to `/logs`
- Request correlation IDs are generated
- Errors use a standard response format
### Tests to implement
- Error middleware unit test
- Request ID propagation test
- Logger redaction test
### Code quality checks
- lint
- typecheck
- tests
- build
### Security considerations
- redact tokens, cookies, passwords, auth headers
- never expose internal stack traces in production
- avoid logging sensitive request bodies

## Task B3 — Security middleware baseline
### Goal
Add baseline API security middleware.
### Files to create
- `src/config/security.config.ts`
- `src/middleware/rate-limit.middleware.ts`
### Expected output
- Helmet enabled
- rate limiting ready
- unknown routes handled safely
### Tests to implement
- Security headers integration test
- Rate-limit integration test
- 404 integration test
### Code quality checks
- lint
- typecheck
- tests
- build
### Security considerations
- strict headers
- safe defaults
- auth and webhook routes rate-limited

# Phase 2 — Database foundation

## Task B4 — Prisma and PostgreSQL setup
### Goal
Set up Prisma ORM and PostgreSQL connection.
### Files to create
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/config/database.ts`
### Expected output
- Prisma connects successfully
- initial migration can run
- seed command available
### Tests to implement
- Prisma schema validation
- DB connection smoke test
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- DB credentials only from env
- least-privilege DB user
- isolated test database

## Task B5 — Identity and RBAC schema
### Goal
Create user, session, role, permission, and refresh token tables.
### Files to create
- update `prisma/schema.prisma`
- `docs/features/auth-and-rbac.md`
### Expected output
- models for users, roles, permissions, role_permissions, user_roles, refresh_tokens, sessions
- default role seed data prepared
### Tests to implement
- role seed test
- unique constraint tests
- refresh token model tests
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- refresh tokens stored hashed
- no default admin credentials
- role changes must be auditable

# Phase 3 — Authentication and authorization

## Task B6 — Authentication module
### Goal
Implement register, login, refresh, and logout with JWT + httpOnly refresh cookie.
### Files to create
- `src/routes/v1/auth.routes.ts`
- `src/controllers/auth.controller.ts`
- `src/services/auth/auth.service.ts`
- `src/repositories/auth.repository.ts`
- `src/schemas/auth/auth.schema.ts`
- `src/utils/jwt.ts`
- `src/config/cookie.config.ts`
- `docs/features/authentication.md`
### Expected output
- register/login/logout/refresh endpoints work
- refresh token rotation works
- access token and refresh token flow is established
### Tests to implement
- register integration test
- login integration test
- refresh rotation test
- logout invalidation test
- password hashing unit test
### Code quality checks
- lint
- typecheck
- unit tests
- integration tests
- build
### Security considerations
- argon2 password hashing
- short-lived access token
- refresh token rotation
- brute-force protection
- httpOnly secure cookie

## Task B7 — Authorization middleware
### Goal
Implement route protection and permission checks.
### Files to create
- `src/middleware/auth.middleware.ts`
- `src/middleware/permission.middleware.ts`
- `src/types/express.d.ts`
- `docs/features/authorization.md`
### Expected output
- protected routes support authenticated user context
- permission checks enforced server-side
### Tests to implement
- unauthorized access test
- forbidden access test
- valid access test
### Code quality checks
- lint
- typecheck
- tests
- build
### Security considerations
- backend-enforced authorization only
- deny by default
- safe error responses

# Phase 4 — Catalog and inventory

## Task B8 — Catalog schema
### Goal
Create product catalog and inventory schema without external object storage integration.
### Files to create
- update `prisma/schema.prisma`
- `docs/features/catalog.md`
### Expected output
- models for categories, brands, products, product_variants, product_images, inventory
- image support via local path or managed URL only
### Tests to implement
- relation tests
- product uniqueness tests
- inventory relation tests
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- validate product input strictly
- admin-only write operations
- no direct trust in file path input

## Task B9 — Catalog APIs
### Goal
Implement public catalog read APIs and admin catalog CRUD.
### Files to create
- `src/routes/v1/product.routes.ts`
- `src/routes/v1/category.routes.ts`
- `src/controllers/product.controller.ts`
- `src/controllers/category.controller.ts`
- `src/services/catalog/`
- `src/repositories/catalog/`
- `src/schemas/product/`
- `docs/features/catalog-api.md`
### Expected output
- public product list and detail endpoints
- admin CRUD endpoints for catalog entities
### Tests to implement
- product list integration test
- product detail integration test
- admin authorization tests
- validation tests
### Code quality checks
- lint
- typecheck
- unit tests
- integration tests
- build
### Security considerations
- pagination limits
- role-based admin access
- validated filters and sorting

# Phase 5 — Cart and orders

## Task B10 — Cart schema and APIs
### Goal
Implement persistent shopping cart.
### Files to create
- update `prisma/schema.prisma`
- `src/routes/v1/cart.routes.ts`
- `src/controllers/cart.controller.ts`
- `src/services/cart/`
- `src/repositories/cart/`
- `src/schemas/cart/`
- `docs/features/cart.md`
### Expected output
- add/update/remove/get cart endpoints work
### Tests to implement
- add item test
- update quantity test
- remove item test
- cart ownership test
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- customer can access only own cart
- quantity validation
- stock validation on server

## Task B11 — Order and payment baseline schema
### Goal
Add checkout, order, payment, and idempotency-related tables.
### Files to create
- update `prisma/schema.prisma`
- `docs/features/checkout-and-orders.md`
### Expected output
- models for orders, order_items, order_addresses, payments, payment_webhook_events, idempotency keys
- status enums defined
### Tests to implement
- unique constraint tests for webhook events
- idempotency key constraint tests
- order-payment relation tests
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- duplicate webhook prevention
- strict status transition design
- audit fields on sensitive records

## Task B12 — Checkout and order creation
### Goal
Create checkout preview and order creation flow up to `PENDING_PAYMENT`.
### Files to create
- `src/routes/v1/checkout.routes.ts`
- `src/routes/v1/order.routes.ts`
- `src/controllers/checkout.controller.ts`
- `src/controllers/order.controller.ts`
- `src/services/checkout/`
- `src/services/orders/`
- `src/repositories/orders/`
- `src/schemas/checkout/`
- `docs/features/checkout.md`
### Expected output
- checkout preview endpoint
- create order endpoint
- order stored as `PENDING_PAYMENT`
### Tests to implement
- checkout preview test
- create order test
- empty cart failure test
- stock validation test
- ownership test for order read
### Code quality checks
- lint
- typecheck
- unit tests
- integration tests
- build
### Security considerations
- totals recalculated server-side
- address ownership validation
- reject invalid cart state

# Phase 6 — Payments and realtime

## Task B13 — Xendit integration
### Goal
Integrate Xendit invoice creation and webhook processing.
### Files to create
- `src/routes/v1/payment.routes.ts`
- `src/routes/v1/webhook.routes.ts`
- `src/controllers/payment.controller.ts`
- `src/controllers/webhook.controller.ts`
- `src/services/payments/`
- `src/integrations/xendit/`
- `src/schemas/payment/`
- `src/middleware/idempotency.middleware.ts`
- `docs/features/payments-xendit.md`
### Expected output
- invoice creation endpoint works
- webhook endpoint updates payment status
- order moves to paid only after verified webhook
### Tests to implement
- invoice creation unit test
- webhook signature verification test
- duplicate webhook processing test
- idempotency test
- payment-order transaction consistency test
### Code quality checks
- lint
- typecheck
- unit tests
- integration tests
- build
### Security considerations
- verify Xendit webhook authenticity
- process webhook idempotently
- never trust frontend payment success
- transaction-safe state changes

## Task B14 — WebSocket payment and notification gateway
### Goal
Add realtime invoice payment updates and notification delivery.
### Files to create
- `src/app/websocket.ts`
- `src/services/websocket/`
- `src/services/notifications/realtime-notification.service.ts`
- `docs/features/websocket.md`
### Expected output
- authenticated websocket connections
- user-scoped realtime updates
- payment status changes broadcast safely
### Tests to implement
- websocket auth test
- channel isolation test
- payment update emission test
### Code quality checks
- lint
- typecheck
- tests
- build
### Security considerations
- authenticated handshake
- user-level channel authorization
- prevent cross-user data leaks

# Phase 7 — Notifications

## Task B15 — Email and in-app notifications
### Goal
Implement email notifications and in-app notification persistence.
### Files to create
- `src/routes/v1/notification.routes.ts`
- `src/controllers/notification.controller.ts`
- `src/services/notifications/`
- `src/services/email/`
- `src/integrations/email/`
- update `prisma/schema.prisma`
- `docs/features/notifications.md`
### Expected output
- in-app notifications can be stored and retrieved
- email notification abstraction exists
- payment/order events trigger notification workflows
### Tests to implement
- notification creation test
- notification authorization test
- email service unit test with mocks
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- no secrets in logs or email payload logs
- user can only read own notifications
- safe notification content rendering

# Phase 8 — Admin operations

## Task B16 — Admin operational APIs
### Goal
Implement operational APIs for support, warehouse, finance, admin, and super admin.
### Files to create
- `src/routes/v1/admin.routes.ts`
- `src/controllers/admin/`
- `src/services/admin/`
- `docs/features/admin-operations.md`
### Expected output
- role-based internal operations available
- fulfillment, finance review, and support flows are separated
### Tests to implement
- role matrix integration tests
- forbidden access tests
- audit trigger tests
### Code quality checks
- lint
- typecheck
- unit tests
- integration tests
- build
### Security considerations
- least privilege
- audit sensitive actions
- no unauthorized payment or role override

# Phase 9 — Testing and hardening

## Task B17 — Coverage enforcement and shared test utilities
### Goal
Enforce minimum 80% coverage and standardize tests.
### Files to create
- `vitest.config.ts`
- `tests/helpers/`
- `tests/fixtures/`
- `docs/testing/strategy.md`
### Expected output
- stable unit and integration test setup
- coverage threshold enforced at 80% minimum
### Tests to implement
- high-risk regression tests for:
  - auth
  - authorization
  - checkout
  - webhook processing
  - user data isolation
### Code quality checks
- lint
- typecheck
- tests
- coverage
- build
### Security considerations
- regression tests for auth bypass
- regression tests for duplicate payment processing
- regression tests for cross-user data access

## Task B18 — Audit logging
### Goal
Add audit trail for sensitive operations.
### Files to create
- update `prisma/schema.prisma`
- `src/services/audit/`
- `src/utils/audit-context.ts`
- `docs/features/audit-logging.md`
### Expected output
- audit logs for role changes, refunds, stock changes, order overrides, admin actions
### Tests to implement
- audit log creation tests
- sensitive action audit integration tests
### Code quality checks
- prisma validate
- prisma format
- lint
- typecheck
- tests
- build
### Security considerations
- immutable-style audit records
- no secret material in audit logs
- actor and target tracking required

# Phase 10 — Docker and deployment

## Task B19 — Docker setup
### Goal
Prepare local and production-ready Docker setup for backend.
### Files to create
- `docker/Dockerfile`
- `docker/Dockerfile.dev`
- `.dockerignore`
### Expected output
- backend builds in Docker
- local development image available
### Tests to implement
- container build smoke test
- health endpoint test in container
### Code quality checks
- Docker build
- app build
- tests
### Security considerations
- non-root container where possible
- no secrets baked into image
- minimal runtime image

## Task B20 — PM2 and VPS deployment docs
### Goal
Prepare PM2 config and VPS deployment documentation.
### Files to create
- `ecosystem.config.cjs`
- `docs/deployment/pm2.md`
- `docs/deployment/vps-deployment.md`
### Expected output
- PM2 deployment configuration
- VPS deployment steps documented
- rollback checklist documented
### Tests to implement
- deployment checklist review
- manual smoke test checklist
### Code quality checks
- script validation
- build validation
- doc review
### Security considerations
- HTTPS behind reverse proxy
- DB not public
- secrets in env only
- firewall and backup guidance included

# Definition of done
A backend task is complete only if:
- implementation works
- existing behavior is not broken
- tests pass
- coverage is preserved or improved
- lint passes
- typecheck passes
- build passes
- docs are updated
- roles are documented for the feature
- security review is completed
