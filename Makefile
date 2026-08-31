.PHONY: install dev migrate openapi test test-backend test-web test-e2e lint typecheck

install:
	uv sync --project backend --dev
	pnpm install

dev:
	docker compose up --build

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
