# Quality Checklist

## Source Code

- Backend is separated by route, middleware, config, and service modules.
- Frontend is separated by pages, layout components, context, and API client.
- ESLint is configured for frontend code standards.
- Backend service logic has focused tests.
- Secrets are externalized through `.env`.

## Runtime

- Backend supports Node.js 20+.
- Frontend runs with Vite.
- Docker Compose can start backend and frontend together.
- Backend exposes `/api/health` for smoke checks.
- JWT config is validated before backend starts.

## Documentation
 
 - `README.md`: install, run, test, and database schema.
 - `docs/SOFTWARE_SPECIFICATION.md`: functional, system, data, and interface specification.
 - `docs/USER_GUIDE.md`: setup and user workflows.
 - `docs/TESTING_AND_TOOLS.md`: test types and commands.
 - `docs/TEAM_PROCESS.md`: coordination and feedback workflow.
+- `docs/SRS team 12 (Complete).docx` & `docs/Vision & Scope team 12 (Complete).docx`: requirements and scope.
+- `docs/Software Detailed Design.pdf` & `docs/Business Rules.pdf`: system architecture and rules.
+- `docs/TEST_CASE_SUITE_REPORT.pdf` & `docs/EVALUATION REPORT.pdf`: testing and evaluation reports.
+- `docs/SOFTWARE_DEVELOPMENT_PROCESS_AND_TASKSHEET.pdf` & Checklists: development tracking and reviews.

## Known Follow-Up Improvements

- Add frontend component tests and E2E tests.
- Add CI with `npm test`, `npm run lint:frontend`, and `npm run build:frontend`.
- Add API examples or OpenAPI documentation.
- Replace local mock payment with a real payment provider for production.
