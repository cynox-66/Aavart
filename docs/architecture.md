# RailNiyojan System Architecture

## Status

This is the implementation architecture for RailNiyojan, the SIH26027 hackathon system.

## Architecture goals

- Produce a reproducible weekly maintenance plan for one explicit corridor.
- Keep input data, rules, solver results, approvals, and exports auditable.
- Make safety and compatibility constraints stronger than optimization preferences.
- Keep the system simple enough to run on one host with Docker Compose.
- Leave clear boundaries for future railway adapters and local AI estimate services.

## Locked technology stack

| Area | Choice | Rule |
|---|---|---|
| Web UI | Next.js, React, TypeScript | Planner and review interface |
| API | Python FastAPI, Pydantic | Public and application API |
| Optimization | Google OR-Tools CP-SAT | Constraint model and solve |
| Data processing | pandas or polars | Controlled CSV/JSON normalization |
| Database | PostgreSQL with PostGIS | Transactional persistence and corridor data |
| Input | CSV/JSON snapshots | No live railway adapters in the demo |
| Deployment | Docker Compose | Single host or VM |
| AI estimates | Local heuristic, fallback-safe | Deterministic fallback is mandatory |

## System boundary

```text
CSV/JSON files
      |
      v
Ingestion and validation
      |
      v
Canonical snapshot store ----> Audit and lineage store
      |
      v
Planning API --> CP-SAT solver --> Independent validator
      |                  |                    |
      |                  v                    v
      |            Candidate plan       Validated result
      v                                       |
Planner UI <-------------------------------+
      |
      v
Human approval --> CSV/PDF export
```

## Components

### Frontend

Next.js/React provides upload, validation, run status, schedule review, reason explanations, locks, re-planning, approval, and export states.

See `docs/architecture/frontend.md`.

### Backend API

FastAPI owns validation orchestration, immutable snapshots, run lifecycle, approvals, audit records, and export guardrails. It does not duplicate solver logic.

See `docs/architecture/backend.md`.

### Synchronous solver path

The API converts a validated snapshot and `Demo Ruleset v1` into a CP-SAT model, runs it inside the request path under a time budget, returns a candidate plan, and emits stable reason codes.

See `docs/architecture/solver.md`.

### PostgreSQL/PostGIS

PostgreSQL stores normalized entities, immutable snapshots, planning runs, schedule items, locks, approvals, and audit events. PostGIS supports corridor and section geometry where needed.

### Independent validator

The validator checks the returned plan independently of the solver model. It verifies overlaps, window limits, resource conflicts, section conflicts, isolation conflicts, stale data, and lock preservation.

## Core data flow

1. User uploads controlled CSV/JSON.
2. API validates structure, types, references, and required fields.
3. Valid data is stored as an immutable snapshot.
4. A planning run records the snapshot ID, ruleset version, deterministic seed, and solver version.
5. The optimizer creates a candidate plan.
6. The independent validator accepts or rejects the candidate.
7. The API calculates reasons and KPIs and exposes the result to the UI.
8. A planner may lock an accepted item and request re-planning.
9. Re-planning preserves locked items and changes only affected, unlocked work.
10. A human approves a valid result.
11. Export is enabled only for the approved result.

## Optional RapidBlock flow

An authorised urgent-job request creates a derived immutable snapshot and a child planning run. The child run reuses the same optimizer, locks, hard constraints, independent validator, approval, and export services. Parent snapshots and runs remain immutable, and the result is a candidate recommendation rather than railway authority.

## Planning run states

`FEASIBLE` or `OPTIMAL`

Failure states are `INFEASIBLE`, `TIMEOUT`, `INVALID`, and `FAILED`.

The system must not label a `FEASIBLE` result as `OPTIMAL`.

## Safety boundaries

- Optimization cannot override safety or compatibility constraints.
- Invalid or stale snapshots cannot be planned or exported.
- Failed validation blocks approval and export.
- Solver timeout is visible and cannot be hidden as success.
- Export never writes to BDMS or another live railway system.
- Human approval is required before every export.

## Deployment

Docker Compose runs:

- web UI
- FastAPI service
- PostgreSQL/PostGIS
- one synchronous CP-SAT solve path

No Kubernetes, high availability, multi-worker scaling, or live identity integration is required for the hackathon demo.

## Future extension points

- File adapters can later implement TMS, SMMS, TDMS, COA, timetable, and BDMS boundaries.
- AI estimate services provide priority or duration inputs behind the same deterministic fallback contract.
- Monthly planning can later create capacity reservations above the weekly planner.
- Multi-corridor planning can later extend topology and conflict scope.
