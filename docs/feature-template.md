# Feature Documentation Template

Use this template for every backend feature.

---

# Feature: <Feature Name>

## 1. Purpose
Describe the business purpose and technical scope of the feature.

## 2. Status
- Planned / In Progress / Completed

## 3. Roles involved
List all roles that interact with the feature.

### Role access matrix
#### `guest`
- Can:
- Cannot:

#### `customer`
- Can:
- Cannot:

#### `customer_support`
- Can:
- Cannot:

#### `warehouse`
- Can:
- Cannot:

#### `finance`
- Can:
- Cannot:

#### `admin`
- Can:
- Cannot:

#### `super_admin`
- Can:
- Cannot:

## 4. API scope
- Routes:
- Request methods:
- Version:
- Public vs protected endpoints:

## 5. Data model impact
- Tables/models involved:
- New enums:
- New indexes:
- Migration notes:

## 6. Validation rules
- Input validation:
- Business rules:
- Edge cases:

## 7. Security considerations
- Authentication requirements
- Authorization requirements
- Sensitive data handling
- Rate limiting needs
- Abuse scenarios
- Race condition considerations
- Logging and redaction rules

## 8. Error handling
- Expected error scenarios
- User-safe error responses
- Internal logging behavior

## 9. Realtime behavior
If applicable:
- WebSocket events emitted
- Allowed subscribers
- Payload rules

## 10. Notification behavior
If applicable:
- Email triggers
- In-app notifications
- Retry or fallback behavior

## 11. Audit logging
Describe which actions must be audited.

## 12. Files involved
- Routes:
- Controllers:
- Services:
- Repositories:
- Schemas:
- Tests:
- Docs:

## 13. Expected output
Describe the expected functional result after implementation.

## 14. Tests to implement
### Unit tests
- 

### Integration tests
- 

### Regression tests
- 

## 15. Code quality checks
- lint
- typecheck
- tests
- coverage
- build

## 16. Deployment notes
- env changes
- migration changes
- backward compatibility notes
- rollback notes

## 17. Open questions
- 
