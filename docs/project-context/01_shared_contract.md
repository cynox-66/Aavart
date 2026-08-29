# Shared Contract

This file is the implementation contract. Changes require an entry in `docs/project-context/04_decision_log.md` and approval from the integration owner.

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

### RapidBlock request

```json
{
  "request_id": "RB-001",
  "base_run_id": "RUN-001",
  "actor": "officer-01",
  "actor_role": "PLANNER",
  "justification": "Urgent inspection after reported defect",
  "urgent_job_id": "JOB-EMG-001",
  "state": "SUBMITTED"
}
```

Required fields: `request_id`, `base_run_id`, `actor`, `actor_role`, `justification`, `urgent_job_id`, and `state`.

Allowed RapidBlock states: `SUBMITTED`, `VALIDATING`, `REJECTED`, `PLANNING`, `CANDIDATE_READY`, `NO_CANDIDATE`.

## Run states

Allowed planner states: `QUEUED`, `RUNNING`, `FEASIBLE`, `OPTIMAL`, `INFEASIBLE`, `TIMEOUT`, `INVALID`, `FAILED`.

## Rules

- All planning runs use an immutable input snapshot.
- Jobs must not overlap when they share an incompatible resource, section, conflict group, or isolation zone.
- A locked schedule item cannot move or be deleted during re-planning.
- Re-planning affects only unlocked jobs in the affected corridor/time region.
- Every planning run records local heuristic AI estimate evidence or deterministic fallback evidence.
- `priority` influences the objective; it does not override safety or compatibility constraints.
- Missing, stale, or invalid input cannot produce an exportable plan.
- A solver `FEASIBLE` result is not automatically `OPTIMAL`.
- Reason codes are required for every scheduled and unscheduled job.
- A planning window may contain compatible jobs from multiple departments. Department identity alone does not require separate windows or permit incompatible overlap.
- A RapidBlock request adds an urgent job through a derived immutable snapshot; it never mutates the base snapshot or base run.
- The urgent job's section, asset, resources, and allowed windows must already belong to the base run's one-corridor snapshot.
- The derived snapshot records its parent snapshot and RapidBlock request. The child run records its parent run.
- RapidBlock uses the same hard constraints, priority range, locks, validator, approval, and export rules as every other planning run.
- An urgent job may receive priority `100`, but urgency is never a safety, compatibility, lock, approval, or authority override.
- RapidBlock returns a candidate plan or a failure explanation. It never grants, sanctions, or makes an operational block available for use.
- `REJECTED` means actor, input, or eligible-window validation failed before planning. `CANDIDATE_READY` requires a `FEASIBLE` or `OPTIMAL` child run and a passing independent validator. Other terminal child-run outcomes map to `NO_CANDIDATE`.

## Minimum API behavior

The implementation must provide equivalent operations, regardless of framework:

- `POST /datasets/validate`
- `POST /planning-runs`
- `GET /planning-runs/{run_id}`
- `POST /planning-runs/{run_id}/lock`
- `POST /planning-runs/{run_id}/replan`
- `POST /planning-runs/{run_id}/approve`
- `GET /planning-runs/{run_id}/export`
- `POST /rapidblock-requests`
- `GET /rapidblock-requests/{request_id}`

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
- `RAPIDBLOCK_CANDIDATE`
- `ACTOR_NOT_AUTHORIZED`
- `NO_ELIGIBLE_WINDOW`
- `LOCK_CONFLICT`
- `OUTSIDE_PLANNING_SCOPE`

Do not invent a new code casually. Add it here first.
