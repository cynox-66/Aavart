# Team Aavart

System name: RailNiyojan

Hackathon build for SIH26027: AI-powered automatic block planning for railway maintenance.

## What this repo is for

RailNiyojan is a working demo of a planning system that:
- ingests maintenance and block data
- validates it into one canonical format
- runs a constraint-based planner
- shows a feasible maintenance plan
- explains why some jobs were scheduled or rejected

This is not a full railway production system. It is a hackathon-grade vertical slice that can actually run.

## Current source of truth

- Problem context: `SIH26027_Detailed_Technical_Architecture.pdf`
- Team workflow: markdown files in `docs/` or `work/`
- Shared interface contract: `docs/01_shared_contract.md`

## Team split

- `akash` - backend, integration, system glue, final merge
- `dev jaiswal` - AI / solver logic
- `arnav gogia` - frontend
- `mohit ray` - design and assets
- `aadi shah` - research and data assumptions
- `sakshi raghuwanshi` - PPT, story, communication

## Working style

1. Lock the shared contract first.
2. Keep each role isolated in its own markdown file.
3. Use mock JSON/CSV files before wiring real UI and backend together.
4. Build one feature slice at a time.

## Suggested feature slices

- dataset upload and validation
- planning run creation
- schedule output with reasons
- manual lock and re-plan
- export / report view

## Minimum demo

The demo should be able to:
- load sample data
- run the planner
- return a schedule
- show unscheduled jobs with reasons
- support one manual override and re-run

## Locked stack

- Frontend: Next.js, React, TypeScript
- Backend: Python FastAPI, Pydantic
- Solver: OR-Tools CP-SAT
- Processing: pandas or polars
- Database: PostgreSQL + PostGIS
- Deployment: Docker Compose
- Input: controlled JSON/CSV snapshots
- ML: optional, with deterministic fallback

## Status

The context and role files are defined. The next step is to implement the backend and frontend around `docs/01_shared_contract.md`.
