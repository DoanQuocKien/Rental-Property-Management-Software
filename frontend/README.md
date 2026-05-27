# Frontend

React + Vite client for Rental Property Management Software.

## Requirements

- Node.js 20+
- npm 9+

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Environment

Create `.env` when the API URL is not the default:

```env
VITE_API_URL=http://localhost:5000/api
```

## Main Areas

- Landlord pages: dashboard, rooms, tenants, contracts, invoices, maintenance, notifications, settings, audit logs.
- Tenant pages: dashboard, profile, contract, invoices, maintenance, notifications.
- Shared API client: `src/api.js`.
- Auth state: `src/context/AuthContext.jsx` and `src/authStorage.js`.
