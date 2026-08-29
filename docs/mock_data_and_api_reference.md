# Mock Data and API Reference

## Important boundary

The generated records are synthetic demonstration data. They are not Railway-
authorized section mappings, permits, isolation plans, or block approvals.

The current planner supports one corridor per planning run. The two corridors
are separate selectable datasets, not one combined solver scope.

## Generated mock data

Root directory:

```text
fixtures/generated/
```

| File | Purpose | Records per corridor |
|---|---|---:|
| `catalog.json` | Lists available corridors and dataset paths | 2 corridors |
| `dataset.json` | Canonical payload consumed by validation and CP-SAT | 11 sections, 33 assets, 12 resources, 33 windows, 90 jobs, 264 train paths, 12 conflict groups |
| `stations.json` | Station sequence, codes, names, and demo coordinates | 12 |
| `isolation_zones.json` | Synthetic protected work areas and responsible department | 11 |
| `block_rules.json` | Synthetic traffic/power rules and required authority | 22 |
| `permits.json` | Synthetic permit/block-request records and statuses | 90 |

Corridors:

| ID | Description | Dataset |
|---|---|---|
| `CORRIDOR-C1` | Narmada Demonstration Corridor | `fixtures/generated/corridor_1/` |
| `CORRIDOR-C2` | Sahyadri Demonstration Corridor | `fixtures/generated/corridor_2/` |

Each corridor contains:

- 12 stations and 11 contiguous sections
- 33 assets and 12 resources
- 33 planning windows
- 90 maintenance jobs
- 264 public-provenance train paths marked as RailRadar context
- 11 isolation zones
- 22 traffic/power block rules
- 90 permit records, including pending and expired examples
- 12 deliberate isolation conflict groups

Regenerate the fixtures from the repository root:

```bash
backend/.venv/bin/python backend/scripts/generate_demo_datasets.py
```

Generator:

```text
backend/scripts/generate_demo_datasets.py
```

## Canonical dataset entities

`dataset.json` is accepted by the current `DatasetPayload` contract and
contains:

- `sections`: internal section IDs, endpoints, line, and direction
- `assets`: track, signal, and OHE assets linked to sections
- `resources`: crews and machines
- `windows`: available or unavailable planning intervals
- `jobs`: maintenance work linked to assets, sections, resources, and windows
- `train_paths`: time intervals that constrain maintenance
- `conflict_groups`: explicit isolation conflicts
- `metadata`: corridor, horizon, ruleset, seed, provenance, and disclaimer

The richer station, block-rule, isolation-zone, and permit files are currently
fixtures for the visualization layer. They are not yet persisted by the
canonical dataset API.

## Implemented API endpoints

Base URL in local development:

```text
http://localhost:8000
```

### Health

`GET /health`

Returns API health status.

### Dataset validation

`POST /datasets/validate`

Accepts either JSON or the supported entity-row CSV format.

JSON example:

```bash
curl -X POST http://localhost:8000/datasets/validate \
  -H 'Content-Type: application/json' \
  --data-binary @fixtures/generated/corridor_1/dataset.json
```

Successful validation returns a deterministic `snapshot_candidate_id`.
Invalid references, duplicate IDs, bad timestamps, and invalid duration ranges
are rejected.

### Planning runs

`POST /planning-runs`

Creates a CP-SAT run from a valid snapshot.

```json
{
  "snapshot_id": "SNAP-...",
  "ruleset_version": "Demo Ruleset v1"
}
```

`GET /planning-runs/{run_id}`

Returns schedule items, unscheduled jobs and reason codes, validator status,
locks, changes, KPIs, approval state, and local heuristic estimate evidence.

`POST /planning-runs/{run_id}/lock`

Locks one scheduled job.

```json
{
  "job_id": "JOB-C1-001",
  "reason": "Planner accepted this block"
}
```

`POST /planning-runs/{run_id}/replan`

Creates a child run for affected sections or windows while preserving locked
items.

```json
{
  "affected_section_ids": ["SEC-C1-01"],
  "affected_window_ids": ["WIN-C1-01-1"]
}
```

`POST /planning-runs/{run_id}/approve`

Records human approval after validation succeeds.

```json
{
  "reviewer": "planner-01",
  "comment": "Reviewed schedule and validator result"
}
```

`GET /planning-runs/{run_id}/export`

Returns a CSV recommendation only after a valid, safe, human-approved run.
It does not issue a Railway block authority.

### RapidBlock

`POST /rapidblock-requests`

Creates an auditable urgent-job candidate from an existing run. The urgent job
must remain inside the base run's corridor and controlled windows.

`GET /rapidblock-requests/{request_id}`

Returns request state, lineage, changed jobs, preserved locks, validator status,
and candidate-plan status.

RapidBlock can return `CANDIDATE_READY`, but that means reviewable candidate
only. It never grants, sanctions, or authorizes an operational block.

### RailRadar public proxy

`GET /railradar/trains/{train_number}/timetable`

Returns public timetable context. `train_number` must be five digits.

Optional query parameter:

```text
halts_only=true|false
```

`GET /railradar/trains/{train_number}/route`

Returns public route context.

Optional query parameters:

```text
format=geojson|polyline|coordinates
stops=true|false
```

`GET /railradar/trains/{train_number}/live`

Returns public live-status context, subject to API-key configuration and
provider availability.

All RailRadar responses include source, provider, fetch time, cache state, and
stale state. Cached stale responses are context only and must not authorize a
plan or replace a Railway-approved snapshot.

## Not currently available as API endpoints

These are files only and need a future read-only endpoint or frontend fixture
loader:

- corridor catalog
- station registry
- isolation zones
- block rules
- permits
- mapping approval/evidence records

Suggested future read-only endpoints:

```text
GET /corridors
GET /corridors/{corridor_id}
GET /corridors/{corridor_id}/stations
GET /corridors/{corridor_id}/isolation-zones
GET /corridors/{corridor_id}/block-rules
GET /corridors/{corridor_id}/permits
```

These endpoints should be added only after the response schemas and provenance
rules are added to the shared contract.

## Demo sequence

```text
GET /health
  -> POST /datasets/validate
  -> POST /planning-runs
  -> GET /planning-runs/{run_id}
  -> POST /planning-runs/{run_id}/lock
  -> POST /planning-runs/{run_id}/replan
  -> POST /planning-runs/{run_id}/approve
  -> GET /planning-runs/{run_id}/export
```

Run the same sequence with `corridor_2/dataset.json` after Corridor 1.

## Safety labels required in the UI

Always show:

- `CONTROLLED-SCENARIO` for generated maintenance and authority-style data
- `PUBLIC` for RailRadar context
- `DERIVED-BY-SYSTEM` for optimizer output
- `Human approval required`
- `Not for operational sanctioning`
