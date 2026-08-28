# Backend Architecture

## Responsibility

The backend owns data integrity, planning orchestration, persistence, auditability, approval, and export guardrails.

## Stack

- Python
- FastAPI
- Pydantic
- PostgreSQL/PostGIS
- pandas or polars for controlled file normalization

## Service boundaries

```text
API layer
  -> validation service
  -> snapshot service
  -> planning run service
  -> lock/re-plan service
  -> approval service
  -> export service
  -> audit service
```

The API submits work to one optimizer worker. The API does not construct CP-SAT constraints directly.

## Required operations

- `POST /datasets/validate`
- `POST /planning-runs`
- `GET /planning-runs/{run_id}`
- `POST /planning-runs/{run_id}/lock`
- `POST /planning-runs/{run_id}/replan`
- `POST /planning-runs/{run_id}/approve`
- `GET /planning-runs/{run_id}/export`

## Persistence model

Persist at minimum:

- canonical entities
- immutable input snapshots
- ruleset version
- planning run metadata
- schedule items
- lock events
- validator results
- approval record
- export record
- audit events

Every planning result must be traceable to its snapshot, ruleset, solver version, deterministic seed, and run ID.

## Validation pipeline

1. Parse CSV/JSON.
2. Validate required fields and types.
3. Validate references between jobs, assets, sections, resources, and windows.
4. Validate timestamps and duration bounds.
5. Validate duplicate IDs.
6. Store only a valid immutable snapshot.

Invalid data returns stable error codes and never silently receives defaults that change meaning.

## Approval and export guardrails

Export is allowed only when:

- snapshot is valid and current;
- solver result is not failed or invalid;
- independent validator passes;
- planner approval exists;
- export has not already been superseded by a re-plan.

The backend must not call BDMS or any live railway system.

## Error contract

Every error contains:

```json
{
  "code": "INVALID_INPUT",
  "message": "duration_min_minutes must be less than duration_max_minutes",
  "details": {}
}
```

## Non-goals

- No hidden business rules in controllers.
- No direct trust of solver output.
- No mutable snapshots.
- No automatic operational sanctioning.
