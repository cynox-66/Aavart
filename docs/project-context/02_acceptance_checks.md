# Acceptance Checks

The demo is complete only when all checks pass.

## Core flow

- [ ] Sample CSV/JSON loads without manual database edits.
- [ ] Validation reports row-level errors and prevents invalid data from entering planning.
- [ ] A run records a snapshot identifier and ruleset version.
- [ ] The planner returns a visible run state and schedule.
- [ ] Every scheduled job has a window, times, status, and reason code.
- [ ] Every unscheduled job has at least one reason code.
- [ ] The UI distinguishes `FEASIBLE`, `OPTIMAL`, `INFEASIBLE`, and `TIMEOUT`.
- [ ] The plan shows enough data to identify corridor, section, asset, department, and time.

## Constraint checks

- [ ] No incompatible jobs overlap.
- [ ] No job exceeds its selected window.
- [ ] Invalid or stale snapshots cannot be exported.
- [ ] A failed independent post-solve validator blocks export.

## Lock and re-plan

- [ ] A planner can lock one accepted schedule item.
- [ ] Re-planning preserves the locked item exactly.
- [ ] Re-planning does not move unrelated locked items.
- [ ] The UI identifies changed, preserved, scheduled, and rejected jobs.

## Approval and export

- [ ] Export is disabled before human approval.
- [ ] Export is disabled for invalid, unsafe, stale, or failed runs.
- [ ] Approval records reviewer, timestamp, run ID, snapshot ID, and ruleset version.
- [ ] Export contains only the approved run.

## Presentation gate

- [ ] The full path can be demonstrated in under five minutes.
- [ ] The demo uses deterministic sample data and produces the same result on repeat runs.
- [ ] No presenter claims live railway integration, automatic sanctioning, or validated ML.
