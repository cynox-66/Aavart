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
- Decision: Build the weekly one-corridor decision-support demo defined in `docs/00_project_context.md`.
- Authority: `docs/03_deviation_lock.md`

### DEC-002: Human approval before export

- Date: 2026-08-28
- Owner: integration owner
- Status: ACCEPTED
- Decision: No export is available until a human approves a valid run.
- Authority: `docs/01_shared_contract.md` and `docs/02_acceptance_checks.md`
