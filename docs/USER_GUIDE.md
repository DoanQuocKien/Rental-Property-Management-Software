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

## 2. Production Environment

Backend on Render:

```env
FRONTEND_URL=https://rental-property-management-software.vercel.app
```

Frontend on Vercel:

```env
VITE_API_URL=https://rental-property-management-software.onrender.com/api
```

Redeploy both services after changing environment variables. Vite reads `VITE_API_URL` at build time, so the frontend must be rebuilt after the variable is updated.

## 3. Docker Setup

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`
- SQLite data is stored in the `backend-data` Docker volume.

## 4. Landlord Workflow

1. Register or login as landlord.
2. Create rooms from the room management screen.
3. Approve or create tenant accounts.
4. Create a lease contract for an available room.
5. Record meter readings and create invoices.
6. Track payments in invoice management.
7. Handle maintenance requests from tenants.
8. Send notifications to all or selected tenants.
9. Review reports and audit logs when needed.

## 5. Tenant Workflow

1. Register as tenant and wait for landlord approval when required.
2. Login after approval.
3. View assigned contract.
4. View invoices and payment state.
5. Submit maintenance requests with description and optional image.
6. Read landlord notifications.
7. Update profile and change password from settings/profile screens.

## 6. Troubleshooting

- If PowerShell blocks `npm`, use `npm.cmd`.
- If backend refuses to start, verify `backend/.env` has `JWT_SECRET`.
- If ports are busy, change `PORT` for backend or pass another Vite port.
- If dependencies are missing, rerun `npm run install:all`.
- On Render, if SQLite fails with `GLIBC_2.38 not found`, clear the Render build cache and redeploy. The backend includes `.npmrc` with `build-from-source=true` so `sqlite3` is compiled against Render's Linux image instead of using an incompatible prebuilt binary.
- If browser requests fail on Vercel with a generic registration/login error, verify Render `FRONTEND_URL` exactly matches `https://rental-property-management-software.vercel.app`.
