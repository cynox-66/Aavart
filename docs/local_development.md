# Local Development

## Prerequisites

- Docker and Docker Compose.
- Git.
- Node.js compatible with the chosen Next.js version.
- Python compatible with FastAPI and OR-Tools.

## Services

Docker Compose should run:

- `web` for Next.js;
- `api` for FastAPI;
- `db` for PostgreSQL/PostGIS;
- `optimizer` for the CP-SAT worker.

## Configuration

Keep secrets in an untracked `.env` file. Provide `.env.example` with non-secret defaults. At minimum define database URL, API URL, solver time budget, deterministic seed, and ruleset version.

## Standard workflow

1. Start PostgreSQL/PostGIS and application services.
2. Apply migrations.
3. Load the deterministic sample fixture.
4. Run unit, API, solver, validator, and end-to-end tests.
5. Open the web UI and run `docs/demo_script.md`.

## Required commands

Document the actual repository commands for:

- install dependencies;
- start Compose;
- stop Compose;
- migrate database;
- seed fixtures;
- run backend tests;
- run frontend tests;
- run all tests;
- build production containers.

Do not invent commands here until the corresponding scripts exist.

## Troubleshooting rules

- Check API, worker, and database logs separately.
- Confirm the snapshot ID before debugging a schedule.
- Reproduce solver issues with the same fixture, ruleset, and seed.
- Never delete database volumes to fix application behavior without explicit approval.
