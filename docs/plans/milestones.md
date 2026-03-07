# Dzeecommerce Backend Milestones

This document groups backend tasks into safe delivery milestones.

## Milestone M1 — Foundation and platform safety
### Included tasks
- B1 — Backend project scaffold
- B2 — Logging and error handling baseline
- B3 — Security middleware baseline
- B4 — Prisma and PostgreSQL setup

### Outcome
- backend runtime foundation exists
- env, logging, error handling, and security baseline are ready
- database connection is established

### Exit criteria
- `/api/v1/health` works
- logs written to `/logs`
- Prisma validates and connects
- baseline tests pass

## Milestone M2 — Identity and access control
### Included tasks
- B5 — Identity and RBAC schema
- B6 — Authentication module
- B7 — Authorization middleware

### Outcome
- users can authenticate securely
- refresh token rotation is active
- role and permission checks are enforced

### Exit criteria
- register/login/refresh/logout pass integration tests
- protected routes enforce auth and permission rules
- role documentation exists for auth features

## Milestone M3 — Catalog and inventory
### Included tasks
- B8 — Catalog schema
- B9 — Catalog APIs

### Outcome
- public catalog read APIs exist
- admin catalog management is available

### Exit criteria
- product list/detail APIs pass tests
- admin catalog write endpoints are protected

## Milestone M4 — Cart and checkout preparation
### Included tasks
- B10 — Cart schema and APIs
- B11 — Order and payment baseline schema
- B12 — Checkout and order creation

### Outcome
- customers can manage carts
- orders can be created up to `PENDING_PAYMENT`
- payment-safe schema foundation exists

### Exit criteria
- cart ownership rules pass tests
- checkout totals are recalculated server-side
- duplicate payment event protections are modeled in DB

## Milestone M5 — Payments and realtime updates
### Included tasks
- B13 — Xendit integration
- B14 — WebSocket payment and notification gateway

### Outcome
- Xendit invoice creation works
- verified webhooks update orders/payments safely
- realtime payment updates reach clients

### Exit criteria
- webhook verification tests pass
- duplicate webhook handling tests pass
- websocket authorization and isolation tests pass

## Milestone M6 — Notifications and admin operations
### Included tasks
- B15 — Email and in-app notifications
- B16 — Admin operational APIs

### Outcome
- users receive in-app and email notifications
- internal operation roles have scoped APIs

### Exit criteria
- notification authorization passes
- role matrix tests pass
- sensitive admin actions are scoped correctly

## Milestone M7 — Quality, audit, and release readiness
### Included tasks
- B17 — Coverage enforcement and shared test utilities
- B18 — Audit logging
- B19 — Docker setup
- B20 — PM2 and VPS deployment docs

### Outcome
- testing quality gate is enforced
- audit logging covers sensitive actions
- Docker and deployment assets are ready

### Exit criteria
- coverage threshold >= 80%
- audit log tests pass
- Docker build succeeds
- deployment documentation is complete
