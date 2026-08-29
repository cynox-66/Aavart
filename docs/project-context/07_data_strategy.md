# Data Strategy Decision

Date: 2026-08-29

## Decision

RailNiyojan will use a hybrid data model:

- Real train and route data from RailRadar.
- Real public timetable/GIS data where useful.
- Railway-authorized maintenance data if it becomes available.
- Controlled scenario data only for unavailable maintenance inputs.

## RailRadar usage

Use RailRadar from the FastAPI backend for:

- Train timetable and route
- Station sequence
- Route GeoJSON
- Live train status and delays
- Station boards

Never expose the API key in the frontend. Store it server-side, cache responses, record source and fetch time, and retain the last valid snapshot on failure.

RailRadar does not replace TMS, SMMS, TDMS, COA, or BDMS data.

## Not using

- Indian Rail API is not the primary source because its documented endpoint uses HTTP and has weaker reliability evidence.
- RailKit is optional only as an SDK wrapper; it is not treated as an independent authoritative source.

## Controlled inputs

Until Railway access exists, maintenance demand and operational constraints may use controlled scenario data for:

- Defects and overdue jobs
- Assets and section mapping
- Crews and machines
- Block windows
- Isolation zones
- Dependencies
- Freight forecasts

The UI must label every record as `PUBLIC`, `RAILWAY-AUTHORIZED`, `CONTROLLED-SCENARIO`, or `DERIVED-BY-SYSTEM`.

## AI decision

Before historical Railway data is available, use explainable heuristic priority scoring and deterministic duration fallback.

Do not claim a trained model, prediction accuracy, or confidence without labelled historical data.

After receiving historical data, train separate models for:

- Maintenance urgency/risk
- Actual work duration

The AI may recommend priority and duration. CP-SAT remains responsible for hard constraints and scheduling.

## Remaining blockers

- Official station/route to Railway section/asset mapping
- Real maintenance records
- Real block and isolation rules
- Crew and machine availability
- COA freight forecasts
- Historical labels for AI training
- RailRadar key, quota, accuracy, and terms verification

## Immediate build scope

1. Integrate RailRadar through FastAPI.
2. Select a real corridor and load its train paths.
3. Generate candidate windows around real train occupancy.
4. Keep maintenance inputs clearly marked as controlled scenario data.
5. Show source, freshness, and provenance on screen.
6. Do not present any result as a sanctioned or operational Railway block.

## RailNiyojan implementation plan

### Officer workflow

`Select corridor and horizon -> check data readiness -> review maintenance demand -> run planner -> inspect map and timeline -> lock/re-plan -> approve -> export recommendation`

### Main screen

- Planning setup: corridor, weekly/monthly horizon, snapshot, ruleset.
- Data readiness: source status, freshness, record counts, and provenance.
- Maintenance demand: jobs, assets, departments, duration, resources, and constraints.
- Corridor view: real stations, track geometry, train paths, windows, conflicts, and isolation zones.
- Plan review: Gantt timeline, scheduled/unscheduled jobs, reason codes, KPI comparison, locks, and changes.
- Approval/export: validator result, reviewer, audit metadata, and guarded recommendation export.

### Build order

1. Verify RailRadar key, quota, accuracy, terms, and response fields.
2. Add a server-side RailRadar adapter and immutable train-data snapshots.
3. Choose one real corridor and map station routes to internal section IDs.
4. Add source/freshness/provenance fields to the API and UI.
5. Replace the ID-based SVG with a data-driven corridor topology/map.
6. Add controlled maintenance/resource inputs with explicit scenario labels.
7. Connect priority scoring, CP-SAT planning, validation, lock, re-plan, approval, and export.
8. Add historical AI training only after authorized labelled data is obtained.

### Acceptance boundary

The demo must prove that real train-path data constrains planning, while controlled maintenance inputs remain visible and honest. No UI or presenter may claim live Railway-system integration, trained AI, or operational block sanctioning without evidence and authorization.
