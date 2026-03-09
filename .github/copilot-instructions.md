# Copilot Instructions for Rental Property Management Software

## Project Overview

This is a **Rental Property Management Software** designed to help landlords and property managers handle day-to-day rental operations. The software aims to streamline tasks such as tenant management, lease tracking, rent collection, maintenance requests, and financial reporting.

> **Note:** Details and features will be updated regularly. Focus on building strong fundamentals first.

## Core Domain Concepts

- **Property**: A real estate unit available for rent (apartment, house, room, etc.)
- **Tenant**: A person or organization renting a property
- **Lease**: A rental agreement between a landlord and tenant, with defined start/end dates and rent amount
- **Rent Payment**: A payment made by a tenant against a lease
- **Maintenance Request**: A request submitted by a tenant or property manager for repairs or upkeep
- **Owner/Landlord**: The person or entity that owns the property

## Architecture Guidelines

- Prefer a **layered architecture**: separate concerns into presentation, business logic, and data access layers
- Use **repository pattern** for data access to keep business logic independent of the database
- Define clear **interfaces/contracts** before implementing concrete classes
- Favor **dependency injection** to keep components loosely coupled and testable

## Coding Conventions

- Use **descriptive, self-explanatory names** for variables, functions, and classes
- Write **small, focused functions** — each function should do one thing well
- Add **input validation** at the boundaries of the system (API controllers, form handlers)
- Prefer **immutability** where possible to reduce side effects
- Always handle **error and edge cases** explicitly; avoid silent failures
- Write **unit tests** for business logic; write **integration tests** for data access layers

## Data Integrity Rules

- A **tenant** must be linked to an active **lease** before any rent payment is recorded
- A **lease** must reference a valid **property** and a valid **tenant**
- **Rent payments** must be validated against the correct lease period and amount
- **Maintenance requests** must be tied to a specific property and optionally a tenant

## Security Considerations

- Never expose sensitive tenant or financial data in logs
- Apply **role-based access control**: owners/admins have full access; tenants can only view their own data
- Sanitize all user inputs to prevent injection attacks
- Store passwords using a strong hashing algorithm (e.g., bcrypt)
- Use HTTPS for all communications and secure tokens for authentication

## Testing Guidelines

- Write tests before or alongside new features (TDD or alongside development)
- Use realistic but anonymized test data for fixtures
- Ensure test coverage for: happy paths, edge cases, and error scenarios
- Keep tests independent — each test should set up and tear down its own state

## Contribution Notes

- Keep pull requests small and focused on a single feature or fix
- Include a brief description of what changed and why in every PR
- Reference related issues in commits and pull requests
- Ensure all tests pass before requesting a review
