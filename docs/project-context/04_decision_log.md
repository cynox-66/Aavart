# Decision Log

Record disagreements here. Chat messages are not decisions.

## Decision template

```text
## DEC-001: Short title
- Date: YYYY-MM-DD
- Owner: name
- Status: PROPOSED | ACCEPTED | REJECTED
- Problem:
- Options considered:
- Decision:
- Contract files affected:
- Demo impact:
- Approval: name/date
```

## Current decisions

### DEC-001: Use a controlled vertical slice

- Date: 2026-08-28
- Owner: integration owner
- Status: ACCEPTED
- Decision: Build the weekly one-corridor decision-support demo defined in `docs/project-context/00_project_context.md`.
- Authority: `docs/project-context/03_deviation_lock.md`

### DEC-002: Human approval before export

- Date: 2026-08-28
- Owner: integration owner
- Status: ACCEPTED
- Decision: No export is available until a human approves a valid run.
- Authority: `docs/project-context/01_shared_contract.md` and `docs/project-context/02_acceptance_checks.md`

### DEC-003: Add RapidBlock as an optional emergency-planning extension

- Date: 2026-08-29
- Owner: integration owner
- Status: ACCEPTED
- Problem: Urgent maintenance may arrive after a weekly candidate plan exists and needs a fast, auditable impact assessment.
- Options considered: mutate the current run, override locks, create a derived snapshot and child run, or defer the feature.
- Decision: RapidBlock validates an authorised urgent-work request, creates a derived immutable snapshot, and launches a child planning run limited to affected unlocked work. It never grants an operational block, overrides locks or safety rules, or bypasses the existing approval and export guardrails.
- Contract files affected: `docs/project-context/01_shared_contract.md`, `docs/data_contract.md`, `docs/api_contract.md`, `docs/database_schema.md`, architecture, safety, test, fixture, UI, and demo documentation.
- Demo impact: Optional 60-90 second extension after the mandatory five-minute core flow. The core acceptance gate remains unchanged.
- Approval: integration owner / 2026-08-29
