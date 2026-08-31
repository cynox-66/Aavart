.PHONY: install dev migrate openapi test test-backend test-web test-e2e lint typecheck

install:
	uv sync --project backend --dev
	pnpm install

dev: .env
	docker compose up --build

# .env is gitignored (it holds real keys), so a fresh clone has none and
# compose's `env_file:` would abort. Seed it from the tracked example.
.env:
	cp .env.example .env
	@echo "Created .env from .env.example - add real API keys if you need them."

migrate:
	uv run --project backend alembic -c backend/alembic.ini upgrade head

openapi:
	uv run --project backend python backend/scripts/export_openapi.py
	pnpm generate:types

test: test-backend test-web

test-backend:
	uv run --project backend pytest backend/tests

test-web:
	pnpm test:web

test-e2e:
	pnpm test:e2e

lint:
	uv run --project backend ruff check backend
	pnpm lint:web

typecheck:
	uv run --project backend mypy --config-file backend/pyproject.toml backend/src
	pnpm typecheck:web
