# Database Schema

PostgreSQL is the transactional store. PostGIS is available for section and corridor geometry but is not required for the first sample scenario.

## Tables

### `snapshots`

`id`, `parent_snapshot_id`, `derivation_type`, `derived_from_request_id`, `source_hash`, `status`, `created_at`, `created_by`, `schema_version`, `raw_metadata`.

Snapshots are immutable after validation.

### `jobs`

`id`, `snapshot_id`, canonical job fields, `created_at`.

Unique constraint: `(snapshot_id, id)`.

### `assets`

`id`, `snapshot_id`, `asset_type`, `section_id`, `status`, optional `geometry`.

### `sections`

`id`, `snapshot_id`, `from_node`, `to_node`, `line`, `direction`, optional `geometry`.

### `windows`

`id`, `snapshot_id`, `section_id`, `start_at`, `end_at`, `availability`.

### `resources`

`id`, `snapshot_id`, `resource_type`, `capacity`, `availability`.

### `conflict_groups`

`id`, `snapshot_id`, `conflict_type`.

### `conflict_group_members`

`conflict_group_id`, `member_type`, `member_id`.

### `planning_runs`

`id`, `snapshot_id`, `parent_run_id`, `trigger_type`, `rapidblock_request_id`, `ruleset_version`, `state`, `solver_version`, `deterministic_seed`, `objective_value`, `bound`, `gap`, `created_at`, `completed_at`.

`trigger_type` is `BASELINE`, `REPLAN`, or `RAPIDBLOCK`.

### `rapidblock_requests`

`id`, `base_run_id`, `base_snapshot_id`, `derived_snapshot_id`, `child_run_id`, `actor`, `actor_role`, `justification`, `source_reported_at`, `urgent_job_id`, `state`, `reason_codes`, `created_at`, `updated_at`.

### `schedule_items`

`id`, `run_id`, `job_id`, `window_id`, `start_at`, `end_at`, `status`, `locked`, `reason_codes`.

### `approvals`

`id`, `run_id`, `reviewer`, `comment`, `approved_at`.

### `audit_events`

`id`, `entity_type`, `entity_id`, `event_type`, `actor`, `created_at`, `metadata`.

## Invariants

- A run references exactly one immutable snapshot.
- A schedule item belongs to exactly one run and job.
- Approved runs cannot be mutated; re-planning creates a new run.
- Locks are recorded as audit events and represented on schedule items.
- Export records reference the exact approved run.
- A RapidBlock request never mutates its base snapshot or base run.
- Every RapidBlock-derived snapshot references one parent snapshot and one request.
- Every RapidBlock child run references its parent run and derived snapshot.

## Indexes

Index `snapshot_id` on snapshot-owned tables, `run_id` on result tables, `(section_id, start_at, end_at)` for schedule/window lookup, `state` on planning runs, and `(base_run_id, state)` on RapidBlock requests.
