# User Guide

## 1. Local Setup

1. Install Node.js 20 or newer and npm.
2. Install dependencies:

```bash
npm run install:all
```

3. Create backend environment file:

```bash
copy backend\.env.example backend\.env
```

4. Start backend:

```bash
npm run start:backend
```

5. Start frontend in another terminal:

```bash
npm run dev:frontend
```

6. Open `http://localhost:5173`.

## 2. Docker Setup

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`
- SQLite data is stored in the `backend-data` Docker volume.

## 3. Landlord Workflow

1. Register or login as landlord.
2. Create rooms from the room management screen.
3. Approve or create tenant accounts.
4. Create a lease contract for an available room.
5. Record meter readings and create invoices.
6. Track payments in invoice management.
7. Handle maintenance requests from tenants.
8. Send notifications to all or selected tenants.
9. Review reports and audit logs when needed.

## 4. Tenant Workflow

1. Register as tenant and wait for landlord approval when required.
2. Login after approval.
3. View assigned contract.
4. View invoices and payment state.
5. Submit maintenance requests with description and optional image.
6. Read landlord notifications.
7. Update profile and change password from settings/profile screens.

## 5. Troubleshooting

- If PowerShell blocks `npm`, use `npm.cmd`.
- If backend refuses to start, verify `backend/.env` has `JWT_SECRET`.
- If ports are busy, change `PORT` for backend or pass another Vite port.
- If dependencies are missing, rerun `npm run install:all`.
