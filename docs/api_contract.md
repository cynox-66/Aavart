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

## Error format

```json
{
  "code": "STALE_SNAPSHOT",
  "message": "The planning snapshot is no longer current",
  "details": {}
}
```

Required HTTP behavior: `400` invalid request, `404` unknown resource, `409` invalid state transition, `422` validation failure, `500` unexpected server failure.
