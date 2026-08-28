# Data Contract

This is the detailed input contract. The summary contract in `docs/project-context/01_shared_contract.md` remains authoritative if a conflict appears.

## Common rules

- IDs are unique within their entity type and use stable strings.
- Timestamps are ISO 8601 with an explicit offset.
- Durations are positive integer minutes.
- Enumerations are uppercase strings.
- Unknown fields may be preserved in lineage metadata but must not affect planning.
- Missing required fields, duplicate IDs, invalid references, and invalid time ranges reject the snapshot.

## Job schema

| Field | Type | Required | Rule |
|---|---|---:|---|
| `job_id` | string | yes | Unique |
| `department` | enum | yes | `TRACK`, `SIGNAL`, `ELECTRICAL`, `CIVIL` |
| `asset_id` | string | yes | References an asset |
| `section_id` | string | yes | References a section |
| `work_type` | string | yes | Human-readable task type |
| `priority` | integer | yes | 0 to 100 |
| `duration_minutes` | integer | yes | Positive nominal duration |
| `duration_min_minutes` | integer | yes | Positive and <= max |
| `duration_max_minutes` | integer | yes | >= min |
| `required_resources` | string[] | yes | At least one resource |
| `allowed_windows` | string[] | yes | At least one window ID |
| `status` | enum | yes | `UNSCHEDULED`, `SCHEDULED`, `LOCKED`, `REJECTED`, `INVALID` |

## Window schema

| Field | Type | Required | Rule |
|---|---|---:|---|
| `window_id` | string | yes | Unique |
| `start` | datetime | yes | Before `end` |
| `end` | datetime | yes | After `start` |
| `section_id` | string | yes | References a section |
| `availability` | enum | yes | `AVAILABLE`, `UNAVAILABLE` |

## Supporting schemas

### Asset

`asset_id`, `asset_type`, `section_id`, `status` where status is `AVAILABLE`, `RESTRICTED`, or `UNAVAILABLE`.

### Resource

`resource_id`, `resource_type`, `capacity`, `availability`.

### Conflict group

`conflict_group_id`, `member_ids`, `conflict_type` where conflict type is `RESOURCE`, `SECTION`, `ISOLATION`, or `TRAIN_PATH`.

## Schedule item

Required fields: `job_id`, `window_id`, `start`, `end`, `status`, `reason_codes`, and `locked`.

## RapidBlock request schema

| Field | Type | Required | Rule |
|---|---|---:|---|
| `base_run_id` | string | yes | References an existing planning run |
| `actor` | string | yes | Non-empty demo identity recorded in audit history |
| `actor_role` | enum | yes | `PLANNER` for the demo allowlist |
| `justification` | string | yes | Non-empty reason for urgent planning |
| `source_reported_at` | datetime | yes | Explicit timezone offset |
| `urgent_job` | object | yes | Must satisfy the complete canonical Job schema |

The urgent job is validated exactly like any other job. Its section, asset, resources, and `allowed_windows` must reference entities in the base run's one-corridor snapshot. Cross-corridor requests are rejected with `OUTSIDE_PLANNING_SCOPE`. The request creates a derived snapshot containing the urgent job and lineage metadata; it never edits the base snapshot.

RapidBlock does not create an operational window. A request with no eligible controlled planning window is rejected with `NO_ELIGIBLE_WINDOW`.

## Validation errors

Return `code`, `message`, `field`, and optional `row` and `details`. Use `INVALID_INPUT` for malformed or inconsistent input.

## Example

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
