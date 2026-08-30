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
Planning API ......................................... one process
      |  CP-SAT solve --> Independent validator       .
      |        |                    |                 .
      |        v                    v                 .
      |  Candidate plan       Validated result        .
      v                              |                .
Planner UI <-----------------------+ .................
      |
      v
Human approval --> CSV/PDF export
```

The solve runs inside the API process, not in a separate service. See
"Execution model" below.

## Components

### Frontend

Next.js/React provides upload, validation, run status, schedule review, reason explanations, locks, re-planning, approval, and export states.

See `docs/architecture/frontend.md`.

### Backend API

FastAPI owns validation orchestration, immutable snapshots, run lifecycle, approvals, audit records, and export guardrails. It does not duplicate solver logic.

See `docs/architecture/backend.md`.

### Optimizer

`railniyojan.optimizer` converts a snapshot and `Demo Ruleset v1` into a CP-SAT model, runs under the configured time budget, returns a candidate plan, and emits stable reason codes.

It is a library the API calls in-process, not a separate worker service. See `docs/architecture/solver.md` and "Execution model" below.

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

`FEASIBLE` or `OPTIMAL` on success. Failure states are `INFEASIBLE`, `TIMEOUT`, `INVALID`, and `FAILED`.

All of these are terminal. There is no `QUEUED` or `RUNNING` state, because there is no moment at which a caller could observe one: `POST /planning-runs` solves before it responds and stores the run once, at the end. Both states previously existed in the enum and were assigned nowhere. They come back with a real queue, not before.

The system must not label a `FEASIBLE` result as `OPTIMAL`.

## Execution model

Planning is **synchronous**. `POST /planning-runs`, `POST /planning-runs/{id}/replan`
and `POST /rapidblock-requests` each build the model, solve it, run the independent
validator, compute KPIs, and persist the finished run before returning `201`. The
response carries `detail_url`, which addresses a run that is already complete - it
is not a status endpoint to poll.

This is a deliberate choice, and the system says so rather than implying otherwise.
An earlier design advertised asynchronous execution it did not have: a `QUEUED` /
`RUNNING` lifecycle nothing assigned, a `status_url` with nothing to report, and an
`optimizer` service in Compose whose only behaviour was to log
`queue execution is not implemented` every thirty seconds. All of that is removed.

### What synchronous actually costs

Less than it sounds, and the number is measured rather than assumed - see
`backend/tests/test_concurrency.py`.

The three endpoints are `def`, not `async def`. FastAPI runs sync handlers in
anyio's worker threadpool (40 threads by default), so the event loop is never
blocked and the API keeps serving during a solve; CP-SAT also releases the GIL
while solving. Measured against a 1.5 s solve: `/health` answers in milliseconds,
and two concurrent runs overlap instead of serialising.

So the real limits are:

- **Throughput** is bounded by threadpool width and available cores, not by one
  run at a time.
- **Latency** is the solve time, paid by the caller. The solver time budget
  (`solver_time_budget_seconds`) bounds it.
- **No cancellation.** A caller that gives up leaves the solve running to
  completion; the UI discards the result rather than adopting a plan the operator
  backed out of.
- **No backpressure.** Enough concurrent requests will exhaust the threadpool,
  and further requests queue inside anyio with no visibility.

Those limits are acceptable for a single-operator demo, which never exercises
concurrent planning. They are not acceptable for production.

### Production path: a real queue

This is the stated production design, not a rewrite the demo needs. It is
genuinely reachable, because the pieces already exist: `SqlAlchemyPlanningStore`
is complete and unit-tested for reload survival, and is selected by setting
`store_backend=sql`.

1. Set `store_backend=sql` in `.env` and Compose. A cross-process worker and the
   API must share state, which the default in-memory store cannot provide.
2. Queue in PostgreSQL with `SELECT ... FOR UPDATE SKIP LOCKED`. No Redis and no
   Celery need enter the stack.
3. The API creates the run `QUEUED` and returns `202` with a status URL; the
   worker claims it `RUNNING`, then writes the terminal state. `QUEUED` and
   `RUNNING` return to `PlanningRunState` at this point, with something assigning
   them.
4. Migrate all three call sites together - create, replan, and rapidblock - so no
   path keeps its own execution model.
5. The frontend's solver progress screen polls the status URL. It already shows
   an honest "waiting" state; this replaces its heartbeat with real progress.
6. Ship stale-claim recovery and a cancel endpoint **in the same change**. Without
   them a worker that dies leaves runs stuck in `QUEUED` forever, which trades one
   false claim for a new hang.

Step 6 is the reason this is not in the demo build. Its payoff is concurrent
throughput that a single-operator demo does not exercise, and it introduces a
failure mode the synchronous design does not have.

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
- FastAPI service (solves in-process)
- PostgreSQL/PostGIS

No Kubernetes, high availability, multi-worker scaling, or live identity integration is required for the hackathon demo.

## Future extension points

- File adapters can later implement TMS, SMMS, TDMS, COA, timetable, and BDMS boundaries.
- AI estimate services provide priority or duration inputs behind the same deterministic fallback contract.
- Monthly planning can later create capacity reservations above the weekly planner.
- Multi-corridor planning can later extend topology and conflict scope.
