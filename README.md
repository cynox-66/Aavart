# RailNiyojan

RailNiyojan is the SIH26027 hackathon system built by Team Aavart.

It is a decision-support demo for railway maintenance block planning. The project loads controlled sample data, validates it, runs a deterministic planner, shows schedule and reason codes, supports lock and re-plan, and blocks export until human approval exists.

This is not live railway sanctioning software. Do not treat the solver output as an operational block.

## If you are new here

Start with these files:

- `docs/project-context/00_project_context.md`
- `docs/project-context/01_shared_contract.md`
- `docs/project-context/02_acceptance_checks.md`
- `docs/project-context/06_progress_tracker.md`
- `docs/local_development.md`
- `docs/solver_capacity.md` - measured coverage, what the planner cannot fit, and why

Those files explain the scope, the rules, the current demo target, and how the repo is expected to evolve.

## What is in the repo

- `apps/web` - Next.js UI for the planning desk
- `backend/src/railniyojan/api` - FastAPI routes, validation, and run lifecycle
- `backend/src/railniyojan/contracts` - shared data contracts
- `backend/src/railniyojan/optimizer` - OR-Tools planner and independent validator
- `backend/migrations` - Alembic migrations
- `fixtures` - deterministic sample data and expected outputs
- `openapi` - generated API schema used by the web app

## Requirements

Install these before you start:

- Docker and Docker Compose
- Python 3.12
- Node.js compatible with the pinned Next.js version
- `pnpm`
- `uv`

## Quick start

1. Copy the environment file.

```bash
cp .env.example .env
```

2. Install dependencies.

```bash
make install
```

3. Start the full stack.

```bash
make dev
```

4. Open the app.

- Web UI: `http://localhost:3000`
- API health check: `http://localhost:8000/health`

The Docker Compose stack starts:

- `db` for PostgreSQL/PostGIS
- `api` for FastAPI, which solves in-process
- `web` for Next.js

## Useful commands

```bash
make test        # backend + web tests
make test-backend
make test-web
make test-e2e
make lint
make typecheck
make migrate
make openapi
```

## Demo  data

The baseline fixture lives at `fixtures/baseline_valid/dataset.json`.

That fixture is what the current demo flow is built around.

## Current status

- The mandatory demo slice is implemented.
- The UI, API, planner, and validator are wired into the actual runtime flow.
- Default local test mode uses process-local storage. Durable demo mode is available with `STORE_BACKEND=sql` after running the database migration.
- RapidBlock is optional and not required for the core demo.

## Common mistakes

- Do not assume the planner output is a railway sanction.
- Do not edit the tracker unless you are Akash.
- Do not change the shared contract without updating the docs, fixtures, and tests that depend on it.

## Need the exact workflow?

Read `docs/local_development.md`. It has the step-by-step day-to-day commands and troubleshooting notes.
