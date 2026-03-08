# Authentication Module (Task B6)

## Goal
Implement register, login, refresh, and logout endpoints with JWT access tokens and httpOnly refresh-cookie flow.

## Endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Behavior summary
- Register creates a user, hashes password with Argon2id, assigns `customer` role (if available), then issues access + refresh tokens.
- Login validates credentials and account state, then issues access + refresh tokens.
- Refresh validates the refresh token from cookie, rotates token (old token revoked + replacement created), and returns a new access token.
- Logout revokes session-linked refresh tokens and clears the refresh cookie.

## Token and cookie flow
- Access token: signed JWT (short-lived), returned in response body.
- Refresh token: signed JWT, stored client-side in `refresh_token` cookie.
- Refresh cookie attributes:
  - `HttpOnly`
  - `SameSite=Strict`
  - `Secure` in production
  - Path-scoped to `/api/v1/auth`

## Roles involved

### guest
- Can do:
  - call `register`
  - call `login`
  - call `refresh` only when valid refresh cookie exists
  - call `logout`
- Cannot do:
  - access customer data without valid authentication
  - perform support, warehouse, finance, admin, or super-admin operations

### customer
- Can do:
  - authenticate through register/login
  - refresh own session tokens
  - logout and invalidate own active session
- Cannot do:
  - access other users’ auth/session records
  - bypass backend authorization checks

### customer_support
- Can do:
  - use standard authentication endpoints for own account
- Cannot do:
  - access or revoke another user’s refresh/session data directly
  - alter RBAC privileges through auth endpoints

### warehouse
- Can do:
  - use standard authentication endpoints for own account
- Cannot do:
  - bypass role restrictions after authentication
  - alter session records for other users

### finance
- Can do:
  - use standard authentication endpoints for own account
- Cannot do:
  - alter identity records outside permitted business APIs
  - bypass role restrictions after authentication

### admin
- Can do:
  - use standard authentication endpoints for own account
- Cannot do:
  - bypass password validation or refresh-token checks
  - bypass audit/security controls through auth endpoints

### super_admin
- Can do:
  - use standard authentication endpoints for own account
- Cannot do:
  - bypass refresh rotation and token verification rules
  - bypass security controls implemented in auth service

## Security review
- Passwords are hashed with Argon2id and never stored in plaintext.
- Access token lifetime is short and controlled by `JWT_ACCESS_EXPIRES_IN`.
- Refresh token rotation is enforced (`replaced_by_token_id`, `revoked_at`).
- Auth routes are guarded by a stricter auth rate limiter.
- Refresh token persistence uses hashed value (`refresh_tokens.token_hash`), not raw token.
- Refresh token transport uses `httpOnly` cookie to reduce script-access risk.
