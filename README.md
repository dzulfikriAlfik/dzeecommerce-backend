# Dzeecommerce Backend

Production-grade e-commerce backend built with Node.js, Express, strict TypeScript, PostgreSQL, and Prisma.

## Summary
This repository contains the backend API for the Dzeecommerce platform. It is designed for high security, maintainability, and scalability, with strong emphasis on clean architecture, strict typing, modular design, and payment safety.

## Core responsibilities
- versioned REST API under `/api/v1`
- JWT authentication with refresh token rotation
- `httpOnly` cookie-based refresh mechanism
- RBAC authorization
- product catalog, cart, checkout, orders, payments
- Xendit payment integration
- realtime invoice/payment updates via WebSocket
- email notifications and in-app notifications
- structured logging with Winston in `/logs`
- Docker-based local/runtime support
- PM2 deployment support
- unit and integration testing with minimum 80% coverage target

## Architecture principles
- strict TypeScript everywhere
- modular layered architecture
- separation of controllers, services, repositories, routes, middleware, utils, models, schemas
- centralized configuration from env files
- safe error handling and sanitized responses
- transaction-safe payment flows
- audit logging for sensitive actions

## Planned main modules
- foundation and platform setup
- authentication and authorization
- catalog and inventory
- cart
- checkout and orders
- payments and Xendit webhook handling
- notifications
- admin and operations
- testing, hardening, deployment

## Standard roles
- `guest`
- `customer`
- `customer_support`
- `warehouse`
- `finance`
- `admin`
- `super_admin`

All feature documentation must explicitly describe:
- roles involved
- what each role can do
- what each role cannot do
- API authorization rules
- security considerations

## Documentation index
- [Development task plan](docs/plans/development-task-plan.md)
- [Milestones](docs/plans/milestones.md)
- [Feature template](docs/feature-template.md)

## Environment strategy
Separate env files are required:
- `.env.development`
- `.env.production`
- `.env.test`

No secrets may be hardcoded or committed.

## Quality gates
Every task must include:
- lint
- typecheck
- tests
- build validation
- security review
- documentation update

## Current status
This repository is in the planning and scaffolding stage.
