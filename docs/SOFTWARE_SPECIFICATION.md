# Software Specification

## 1. Purpose

Rental Property Management Software supports landlords and tenants in managing rooms, contracts, invoices, maintenance requests, notifications, reports, and audit logs.

## 2. Actors

- Landlord: manages rooms, tenants, contracts, invoices, maintenance requests, notifications, reports, and settings.
- Tenant: views contract, invoices, notifications, profile, and maintenance requests.

## 3. Functional Specification

### Authentication

- Register tenant or landlord accounts.
- Tenant registration starts in pending status.
- Login returns access and refresh tokens.
- Refresh token rotation is supported.
- Logout and revoke endpoints invalidate active tokens.
- Role-based access protects landlord and tenant routes.

### Room Management

- Landlord can create, view, update, delete, and seed rooms.
- Room status supports available and occupied workflows.
- Available-room listing excludes occupied rooms.

### Tenant And Contract Management

- Landlord can view tenant accounts and tenant details.
- Landlord can create lease contracts for available rooms.
- Creating a contract updates the room to occupied.
- Tenant can view the active contract assigned to them.

### Billing And Invoice Management

- Landlord can read previous meter readings by room and period.
- Landlord can calculate invoice totals from rent, electricity, water, and service fees.
- Landlord can create invoices, mark payments, and delete eligible invoices.
- Tenant can view invoices and use the mock payment flow.

### Maintenance

- Tenant can create maintenance requests with optional image upload.
- Landlord can view, assign, update, and close maintenance requests.

### Notifications

- Landlord can send broadcast or targeted notifications.
- Tenant can view and mark notifications as read.
- Unread-count endpoint supports notification badges.

### Reports And Audit Logs

- Reports export temporary residence and tax data.
- Audit logs track important landlord mutations for accountability.

## 4. System Specification

- Backend: Node.js 20+, Express, SQLite.
- Frontend: React, Vite, Axios, Recharts.
- Auth: JWT access token plus refresh token rotation.
- Persistence: SQLite database, default `backend/rental.db`.
- Uploads: local `backend/uploads` directory.
- Deployment: local npm scripts or Docker Compose.

## 5. Data Specification

Main tables are:

- `users`: account, profile, role, and status.
- `rooms`: room attributes, price, capacity, status, landlord owner.
- `lease_contracts`: tenant-room lease period and deposit.
- `meter_readings`: electricity and water readings by room.
- `invoices`: rent, utilities, services, status, and payment metadata.
- `maintenance_requests`: tenant issue reports and handling status.
- `notifications`: sender, recipient, message, and read state.
- `refresh_tokens` and `revoked_access_tokens`: token lifecycle.
- `audit_logs`: mutation history and metadata.

See `README.md` for detailed schema columns.

## 6. Interface Specification

### Backend API

Base URL: `http://localhost:5000/api`

Production backend URL: `https://rental-property-management-software.onrender.com/api`

Production frontend URL: `https://rental-property-management-software.vercel.app`

Key route groups:

- `/auth`: register, login, refresh, logout, revoke, change password.
- `/rooms`: room CRUD and available-room listing.
- `/contracts`: contract creation and contract detail.
- `/tenants`: tenant profile, tenant invoices, tenant maintenance.
- `/landlord`: landlord tenant list, maintenance, billing calculation, financial stats.
- `/invoices`: landlord invoice operations and mock payment.
- `/notifications`: send, list, unread count, mark read, delete.
- `/reports`: report exports.
- `/audit-logs`: audit log search and filters.

### Frontend UI

- Landlord layout: dashboard, rooms, tenants, contracts, invoices, maintenance, notifications, reports, audit, settings.
- Tenant layout: dashboard, profile, contract, invoices, maintenance, notifications.
- UI language: Vietnamese.
