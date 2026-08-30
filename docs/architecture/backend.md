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
  -> RapidBlock request service
  -> approval service
  -> export service
  -> audit service
```

The API calls the optimizer in-process and solves before responding; there is no worker service. It does not construct CP-SAT constraints directly. See `docs/architecture.md`, "Execution model", for what synchronous execution costs and the queued production path.

## Required operations

- `POST /datasets/validate`
- `POST /planning-runs`
- `GET /planning-runs/{run_id}`
- `POST /planning-runs/{run_id}/lock`
- `POST /planning-runs/{run_id}/replan`
- `POST /planning-runs/{run_id}/approve`
- `GET /planning-runs/{run_id}/export`
- `POST /rapidblock-requests`
- `GET /rapidblock-requests/{request_id}`

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
- RapidBlock request state and parent/child snapshot and run lineage

Every planning result must be traceable to its snapshot, ruleset, solver version, deterministic seed, and run ID.

## Validation pipeline

1. Parse CSV/JSON.
2. Validate required fields and types.
3. Validate references between jobs, assets, sections, resources, and windows.
4. Validate timestamps and duration bounds.
5. Validate duplicate IDs.
6. Store only a valid immutable snapshot.

Invalid data returns stable error codes and never silently receives defaults that change meaning.

## RapidBlock orchestration

1. Record the request and actor before planning.
2. Authorise the demo actor and validate the urgent job against the canonical schema.
3. Confirm that the section, asset, resources, and every requested window belong to the base run's corridor and are eligible for planning.
4. Create a derived immutable snapshot containing the urgent job and parent lineage.
5. Create a child run with `trigger_type` set to `RAPIDBLOCK`.
6. Re-plan only the affected corridor and time region while preserving all locked items.
7. Run the independent validator and return either a candidate comparison or stable failure reasons.

The service does not create railway authority, invent an operational window, or bypass the existing approval and export services.

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
