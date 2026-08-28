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
