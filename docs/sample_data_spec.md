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

## Fixture rules

- Use stable IDs such as `JOB-001`, `SEC-A`, and `WIN-001`.
- Use explicit timezone offsets.
- Do not use real operational railway data.
- Include expected outcomes in fixture metadata or test files.
- Re-running the same fixture with the same seed must produce the same result.
