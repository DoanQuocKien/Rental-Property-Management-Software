# Rental Property Management Software

A full-stack rental property management system for landlords, staff, and tenants. The project includes a Node.js/Express backend with SQLite storage and a React/Vite frontend.

## Features

- User authentication with access and refresh tokens
- Role-based workflows for landlords, tenants, and staff
- Room, tenant, and lease contract management
- Electricity and water meter readings
- Invoice creation, payment status tracking, and mock payment flow
- Maintenance requests with staff assignment and issue photos
- Notifications, audit logging, reports, and export support

## Tech Stack

- **Backend:** Node.js, Express, SQLite, JWT, Jest
- **Frontend:** React, Vite, React Router, Axios, Recharts
- **Tooling:** Docker Compose, ESLint, npm workspaces-style root scripts

## Requirements

- Node.js 20.17 or newer
- npm 9 or newer
- Docker and Docker Compose, optional

## Getting Started

Install all project dependencies:

```bash
npm install
npm run install:all
```

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Create the frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

Update secrets in `backend/.env` before running the API:

```env
PORT=5000
NODE_ENV=development
DB_PATH=./rental.db
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_REFRESH_SECRET=replace_with_another_long_random_secret_at_least_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Start the backend:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev:frontend
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Docker

Run both services with Docker Compose:

```bash
docker compose up --build
```

Docker Compose maps the frontend to `http://localhost:5173` and the backend to `http://localhost:5000/api`. SQLite data and uploaded files are stored in Docker volumes.

## Root Scripts

```bash
npm run install:all      # install backend and frontend dependencies
npm run dev:backend      # run backend with nodemon
npm run start:backend    # run backend with node
npm run dev:frontend     # run Vite frontend
npm run build:frontend   # build frontend for production
npm run lint:frontend    # run frontend lint checks
npm test                 # run backend tests
npm run test:coverage    # run backend tests with coverage
```

## Project Structure

```text
.
|-- backend/              # Express API, SQLite database setup, routes, services, tests
|-- frontend/             # React/Vite application
|-- docs/                 # Project documentation and quality materials
|-- docker-compose.yml    # Local container orchestration
|-- package.json          # Root scripts
`-- vercel.json           # Frontend deployment configuration
```

## Documentation

- `docs/SOFTWARE_SPECIFICATION.md` - functional, system, data, and interface specification
- `docs/USER_GUIDE.md` - installation and usage guide
- `docs/TESTING_AND_TOOLS.md` - testing approach and tools
- `docs/TEAM_PROCESS.md` - collaboration process and feedback handling
- `docs/QUALITY_CHECKLIST.md` - source code, runtime, and documentation checklist

## Database

The SQLite database is created and migrated by `backend/database.js`. By default, local development stores it at `backend/rental.db`; Docker stores it in a persistent volume at `/app/data/rental.db`.

Current tables:

- `users` - user profiles, roles, and authentication data
- `rooms` - rental room information, pricing, capacity, and status
- `lease_contracts` - tenant-room lease agreements
- `meter_readings` - electricity and water readings by room
- `invoices` - billing records, due dates, and payment status
- `maintenance_requests` - tenant repair requests and staff handling
- `refresh_tokens` - active refresh tokens for authentication
- `revoked_access_tokens` - revoked access token blacklist entries

The backend keeps backward-compatible API keys where needed, such as older `id`, `name`, and `capacity` fields alongside newer keys like `userID`, `roomID`, `fullName`, and `maxOccupants`.

## Deployment Notes

The frontend is configured for Vercel. Set `VITE_API_URL` to the deployed backend API URL.

The backend can run on Render or another Node.js host. If using SQLite in production, configure persistent storage and set `DB_PATH` accordingly. Render's default filesystem is ephemeral, so temporary SQLite storage is suitable only for demos and tests.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
