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
- `api` for validation, planning, re-plan, approval, export, and archive endpoints.

## Configuration

Keep secrets in an untracked `.env` file. Provide `.env.example` with non-secret defaults. At minimum define database URL, API URL, solver time budget, deterministic seed, and ruleset version.

## Standard workflow

1. Copy `.env.example` to `.env`.
2. Run `make install`.
3. Run `make test` before changing code.
4. Run `make dev` to start PostgreSQL/PostGIS and application services.
5. Run `make migrate` when migration execution is not handled by the environment.
6. Open `http://localhost:3000` and confirm that the API health state is online.
7. Use `fixtures/baseline_valid/dataset.json` for the first validation request.

## Commands

| Operation | Command |
|---|---|
| Install dependencies | `make install` |
| Start services | `make dev` |
| Stop services | `docker compose down` |
| Apply migrations | `make migrate` |
| Run backend tests | `make test-backend` |
| Run frontend tests | `make test-web` |
| Run browser smoke test | `make test-e2e` |
| Run all tests | `make test` |
| Lint | `make lint` |
| Type-check | `make typecheck` |
| Regenerate OpenAPI and frontend types | `make openapi` |
| Build containers | `pnpm build:web && docker compose build` |

There is no seed command yet. The baseline fixture is validated through `POST /datasets/validate`; database snapshot persistence belongs to the upload/validation feature slice.

For the durable backend path, set `STORE_BACKEND=sql` and run the existing migration before starting the API. Default local tests keep `STORE_BACKEND=memory` so they do not require Docker/Postgres.

The web container packages the verified Next.js standalone output. Run `pnpm build:web` before rebuilding its image; frontend source is not hot-reloaded inside Compose.

## Troubleshooting rules

- Check API and database logs separately.
- Confirm the snapshot ID before debugging a schedule.
- Reproduce solver issues with the same fixture, ruleset, and seed.
- Never delete database volumes to fix application behavior without explicit approval.
