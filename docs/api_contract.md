# API Contract

The API is the only integration boundary between UI, persistence, and the optimizer. All responses are JSON except export downloads.

## `POST /datasets/validate`

Accept controlled CSV/JSON. Return validation results without creating a planning run.

```json
{
  "valid": true,
  "snapshot_candidate_id": "SNAP-001",
  "errors": [],
  "counts": {"jobs": 12, "windows": 8, "assets": 6}
}
```

## `POST /planning-runs`

Request:

```json
{
  "snapshot_id": "SNAP-001",
  "ruleset_version": "Demo Ruleset v1"
}
```

Response includes `run_id`, `state`, `snapshot_id`, `ruleset_version`, `created_at`, and `status_url`.

## `GET /planning-runs/{run_id}`

Return run metadata, schedule items, unscheduled jobs, reason codes, validator result, KPI summary, locks, and approval state.

## `POST /planning-runs/{run_id}/lock`

Request:

```json
{
  "job_id": "JOB-001",
  "reason": "Planner accepted this block"
}
```

Only accepted scheduled items may be locked.

## `POST /planning-runs/{run_id}/replan`

Request:

```json
{
  "affected_section_ids": ["SEC-A"],
  "affected_window_ids": ["WIN-001"]
}
```

The response creates a new run. It must preserve locked items and identify changed items.

## `POST /planning-runs/{run_id}/approve`

Request:

```json
{
  "reviewer": "planner-01",
  "comment": "Reviewed schedule and validator result"
}
```

Approval fails for invalid, stale, unsafe, failed, or timed-out/degraded results.

## `GET /planning-runs/{run_id}/export`

Returns CSV or PDF only after approval. It must include run ID, snapshot ID, ruleset version, reviewer, and approval timestamp.

## `POST /rapidblock-requests`

Request:

```json
{
  "base_run_id": "RUN-001",
  "actor": "officer-01",
  "actor_role": "PLANNER",
  "justification": "Urgent inspection after reported defect",
  "source_reported_at": "2026-09-02T10:15:00+05:30",
  "urgent_job": {
    "job_id": "JOB-EMG-001",
    "department": "TRACK",
    "asset_id": "ASSET-001",
    "section_id": "SEC-A",
    "work_type": "urgent rail inspection",
    "priority": 100,
    "duration_minutes": 45,
    "duration_min_minutes": 45,
    "duration_max_minutes": 60,
    "required_resources": ["TRACK_TEAM_1"],
    "allowed_windows": ["WIN-002"],
    "status": "UNSCHEDULED"
  }
}
```

The backend records the request, validates the actor and urgent job, creates a derived immutable snapshot, and launches a child planning run. The response includes `request_id`, `state`, `base_run_id`, nullable `derived_snapshot_id`, nullable `child_run_id`, and `status_url`. Invalid requests remain auditable and return `REJECTED` with stable reason codes.

## `GET /rapidblock-requests/{request_id}`

Return request metadata, state, reason codes, base and derived snapshot lineage, parent and child run IDs, changed and preserved jobs, validator result, and candidate-plan status. `CANDIDATE_READY` means reviewable, not operationally granted.

## Error format

```json
{
  "code": "STALE_SNAPSHOT",
  "message": "The planning snapshot is no longer current",
  "details": {}
}
```

Required HTTP behavior: `400` invalid request, `403` unauthorised actor, `404` unknown resource, `409` invalid state transition, `422` validation failure, `500` unexpected server failure.
