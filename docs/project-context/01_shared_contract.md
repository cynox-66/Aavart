# Shared Contract

This file is the implementation contract. Changes require an entry in `docs/04_decision_log.md` and approval from the integration owner.

## Canonical entities

### Job

```json
{
  "job_id": "JOB-001",
  "department": "TRACK",
  "asset_id": "ASSET-001",
  "section_id": "SEC-A",
  "work_type": "rail inspection",
  "priority": 80,
  "duration_minutes": 120,
  "duration_min_minutes": 90,
  "duration_max_minutes": 150,
  "required_resources": ["TRACK_TEAM_1"],
  "allowed_windows": ["WIN-001"],
  "status": "UNSCHEDULED"
}
```

Required fields: `job_id`, `department`, `asset_id`, `section_id`, `work_type`, `priority`, duration fields, `required_resources`, `allowed_windows`, and `status`.

Allowed job statuses: `UNSCHEDULED`, `SCHEDULED`, `LOCKED`, `REJECTED`, `INVALID`.

### Planning window

```json
{
  "window_id": "WIN-001",
  "start": "2026-09-01T09:00:00+05:30",
  "end": "2026-09-01T13:00:00+05:30",
  "section_id": "SEC-A",
  "availability": "AVAILABLE"
}
```

### Schedule item

```json
{
  "job_id": "JOB-001",
  "window_id": "WIN-001",
  "start": "2026-09-01T09:00:00+05:30",
  "end": "2026-09-01T11:00:00+05:30",
  "status": "SCHEDULED",
  "reason_codes": ["PRIORITY_FIT"],
  "locked": false
}
```

Allowed schedule statuses: `SCHEDULED`, `LOCKED`, `REJECTED`.

## Run states

Allowed planner states: `QUEUED`, `RUNNING`, `FEASIBLE`, `OPTIMAL`, `INFEASIBLE`, `TIMEOUT`, `INVALID`, `FAILED`.

## Rules

- All planning runs use an immutable input snapshot.
- Jobs must not overlap when they share an incompatible resource, section, conflict group, or isolation zone.
- A locked schedule item cannot move or be deleted during re-planning.
- Re-planning affects only unlocked jobs in the affected corridor/time region.
- `priority` influences the objective; it does not override safety or compatibility constraints.
- Missing, stale, or invalid input cannot produce an exportable plan.
- A solver `FEASIBLE` result is not automatically `OPTIMAL`.
- Reason codes are required for every scheduled and unscheduled job.

## Minimum API behavior

The implementation must provide equivalent operations, regardless of framework:

- `POST /datasets/validate`
- `POST /planning-runs`
- `GET /planning-runs/{run_id}`
- `POST /planning-runs/{run_id}/lock`
- `POST /planning-runs/{run_id}/replan`
- `POST /planning-runs/{run_id}/approve`
- `GET /planning-runs/{run_id}/export`

Errors must include a stable `code` and readable `message`.

## Reason codes

Use stable uppercase codes, including:

- `PRIORITY_FIT`
- `WINDOW_UNAVAILABLE`
- `RESOURCE_CONFLICT`
- `SECTION_CONFLICT`
- `ISOLATION_CONFLICT`
- `TRAIN_PATH_CONFLICT`
- `DURATION_EXCEEDS_WINDOW`
- `LOCK_PRESERVED`
- `INVALID_INPUT`
- `STALE_SNAPSHOT`
- `SOLVER_TIMEOUT`
- `SAFETY_VALIDATION_FAILED`

Do not invent a new code casually. Add it here first.
