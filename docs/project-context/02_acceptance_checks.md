# Acceptance Checks

The demo is complete only when all checks pass.

## Core flow

- [x] Sample CSV/JSON loads without manual database edits.
- [x] Validation reports row-level errors and prevents invalid data from entering planning.
- [x] A run records a snapshot identifier and ruleset version.
- [x] The planner returns a visible run state and schedule.
- [x] Every scheduled job has a window, times, status, and reason code.
- [x] Every unscheduled job has at least one reason code.
- [x] The UI distinguishes `FEASIBLE`, `OPTIMAL`, `INFEASIBLE`, and `TIMEOUT`.
- [x] The plan shows enough data to identify corridor, section, asset, department, and time.

## Constraint checks

- [x] No incompatible jobs overlap.
- [x] No job exceeds its selected window.
- [x] Invalid or stale snapshots cannot be exported.
- [x] A failed independent post-solve validator blocks export.

## Lock and re-plan

- [x] A planner can lock one accepted schedule item.
- [x] Re-planning preserves the locked item exactly.
- [x] Re-planning does not move unrelated locked items.
- [x] The UI identifies changed, preserved, scheduled, and rejected jobs.

## Approval and export

- [x] Export is disabled before human approval.
- [x] Export is disabled for invalid, unsafe, stale, or failed runs.
- [x] Approval records reviewer, timestamp, run ID, snapshot ID, and ruleset version.
- [x] Export contains only the approved run.

## Presentation gate

- [x] The full path can be demonstrated in under five minutes.
- [x] The demo uses deterministic sample data and produces the same result on repeat runs.
- [x] No presenter claims live railway integration, automatic sanctioning, or validated ML.

## Optional RapidBlock extension gate

- [ ] An authorised demo planner can submit one canonical urgent job against an existing run.
- [ ] The base snapshot and base run remain unchanged.
- [ ] The request creates a derived snapshot and child run with traceable parent lineage.
- [ ] Every locked item remains exactly unchanged in the child run.
- [ ] Re-planning changes only affected unlocked work.
- [ ] A feasible request shows a validated `CANDIDATE_READY` comparison with stable reason codes.
- [ ] An unauthorised actor, missing eligible window, or locked conflict returns a stable failure reason and no false candidate.
- [ ] A cross-corridor request is rejected with `OUTSIDE_PLANNING_SCOPE` and does not broaden the base run.
- [ ] The child run uses the normal approval and export guardrails.
- [ ] The UI and presenter never describe the candidate as granted, sanctioned, or operationally available.
- [ ] The optional RapidBlock extension can be demonstrated in 60-90 seconds without changing the mandatory five-minute core flow.
