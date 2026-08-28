# Database Schema

PostgreSQL is the transactional store. PostGIS is available for section and corridor geometry but is not required for the first sample scenario.

## Tables

### `snapshots`

`id`, `source_hash`, `status`, `created_at`, `created_by`, `schema_version`, `raw_metadata`.

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

`id`, `snapshot_id`, `ruleset_version`, `state`, `solver_version`, `deterministic_seed`, `objective_value`, `bound`, `gap`, `created_at`, `completed_at`.

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

## Indexes

Index `snapshot_id` on snapshot-owned tables, `run_id` on result tables, `(section_id, start_at, end_at)` for schedule/window lookup, and `state` on planning runs.
