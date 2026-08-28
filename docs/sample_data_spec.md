# Sample Data Specification

The shared fixture must be deterministic and exercise every acceptance path. Keep it small enough to understand during the demo.

## Required entities

- At least 2 sections in one corridor.
- At least 4 jobs across 2 departments.
- At least 2 resources.
- At least 3 planning windows.
- At least 1 conflict group.
- At least 1 isolation zone.
- At least 1 train path conflict.

## Required scenarios

### `baseline_valid`

Produces a repeatable feasible plan with scheduled and unscheduled jobs.

At least one planning window must support compatible jobs from two departments so the demo proves that department identity alone does not require separate windows.

### `resource_conflict`

Two jobs require the same resource and overlap in allowed time. One must be delayed or rejected with `RESOURCE_CONFLICT`.

### `invalid_input`

Contains a duplicate ID, an unknown section reference, and an invalid duration range. Validation must reject it.

### `lock_replan`

The first run schedules `JOB-001`. Lock it, change an affected window, and verify its exact times remain unchanged in the new run.

### `infeasible`

All available windows are unavailable or too short. The run must be `INFEASIBLE` and non-exportable.

### `timeout`

Use a controlled test configuration with a short solver time budget. The run must be visibly degraded and non-exportable.

### `rapidblock_feasible`

Adds `JOB-EMG-001` with priority `100` to a derived snapshot. The child run must preserve all locks, schedule the urgent job in an existing eligible window, and report changed and preserved jobs with `RAPIDBLOCK_CANDIDATE`.

### `rapidblock_no_window`

Submits a valid urgent job whose requested windows are unavailable. The request must be `REJECTED` with `NO_ELIGIBLE_WINDOW` and must not invent a new window.

### `rapidblock_lock_conflict`

Submits an urgent job that conflicts with a locked item. The locked item must remain unchanged and the request must produce `NO_CANDIDATE` with `LOCK_CONFLICT`.

### `rapidblock_unauthorised`

Submits the feasible urgent job using an actor outside the demo allowlist. The request must be `REJECTED` with `ACTOR_NOT_AUTHORIZED` before a child run is created.

### `rapidblock_outside_scope`

Submits an urgent job for a section outside the base run's corridor. The request must be `REJECTED` with `OUTSIDE_PLANNING_SCOPE` and must not broaden the snapshot.

## Fixture rules

- Use stable IDs such as `JOB-001`, `SEC-A`, and `WIN-001`.
- Use explicit timezone offsets.
- Do not use real operational railway data.
- Include expected outcomes in fixture metadata or test files.
- Re-running the same fixture with the same seed must produce the same result.
