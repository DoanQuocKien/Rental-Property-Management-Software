# Team Process And Coordination

## Development Process

The project follows a sprint-based workflow:

1. Select user stories for the sprint.
2. Break user stories into implementation tasks.
3. Implement on feature branches.
4. Review, merge, and verify with tests.
5. Capture feedback and update backlog items.

## Suggested Branch Convention

- `main`: stable integrated code.
- `SprintX-name-feature`: sprint or feature branch.
- `backend-*`: backend-focused branch.
- `frontend-*`: frontend-focused branch.

## Collaboration Evidence To Keep In Repo

Store the following files under `docs/process/` or root:

- Sprint plan and sprint schedule.
- Task sheet with owner, status, start date, due date, and evidence link.
- Meeting notes.
- Customer feedback notes.
- Retrospective notes.

## Feedback Handling

Use this flow for customer feedback:

1. Record the feedback with date, source, and affected feature.
2. Classify it as bug, improvement, or new requirement.
3. Add priority and owner.
4. Link the fix to a commit or pull request.
5. Re-test and note the result.

## Definition Of Done

A task is done when:

- Code is committed and pushed.
- Relevant tests pass.
- Frontend lint/build passes when frontend is affected.
- Documentation is updated when behavior or setup changes.
- Reviewer or teammate has checked the result.
