# Testing And Tools

## Test Types Used

- Unit tests: service-level billing, meter reading, and audit-log logic in `backend/__tests__/services.test.js`.
- Integration/API tests: Express endpoints with Supertest in `backend/__tests__/api.test.js`.
- Static checks: ESLint for frontend React code.
- Production build check: Vite build for frontend.
- Runtime smoke check: backend health endpoint `/api/health`.

## Commands

```bash
npm test
npm run test:coverage
npm run lint:frontend
npm run build:frontend
```

## Tools

- Jest: backend unit and integration tests.
- Supertest: HTTP endpoint testing without opening a real network port.
- ESLint: frontend code standard and React Hooks rules.
- Vite: frontend development server and production build.
- Docker Compose: repeatable local environment.
- Git/GitHub: version control and branch collaboration.

## Current Coverage Scope

Covered:

- Auth register/login/refresh/logout/revoke flows.
- Room CRUD and landlord/tenant authorization.
- Contract creation and room status transition.
- Billing calculation and validation cases.
- Previous meter reading lookup.
- Audit log serialization and filters.

Recommended next tests:

- Frontend component tests for forms and route guards.
- End-to-end tests for landlord and tenant workflows.
- Report export tests for PDF/Excel output.
