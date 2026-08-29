# Operational Feature Ideation

This document tracks candidate add-ons for RailNiyojan. They are not part of the locked core scope until the team explicitly approves them.

## Current status

| Area | Status | What exists now | What is missing |
|---|---|---|---|
| Core foundation | Done | Health endpoint, dataset validation, planning flow, typed API contract, frontend shell, smoke tests | Full production hardening |
| Planning runs | Done | `create`, `get`, `lock`, `replan`, `approve`, export, KPI summary, and AI estimate evidence are implemented | UI wiring for new KPI/RapidBlock fields |
| Demo slice | Done | Baseline fixture validation, planning, lock/re-plan, approval, export, SQL-backed persistence path, and RapidBlock backend are executable | Monthly planning remains out of scope |
| Operational add-ons | Partial | RapidBlock backend exists; `BlockReady` and `WeatherGuard` remain design notes | Frontend RapidBlock surface, BlockReady, WeatherGuard |

## What matters

- The repo now has one real demo slice: validation, planning, lock/re-plan, approval, and export.
- The UI executes the backend workflow and reflects backend truth.
- A SQL-backed persistence path exists behind `STORE_BACKEND=sql`; default tests still use memory.
- `RapidBlock` now has backend endpoints, guardrail tests, lineage, and audit/export records, but Arnav still owns any UI surface.
- The AI layer is a local deterministic heuristic with fallback evidence, not validated ML superiority.

## What is missing

- Frontend wiring for new KPI and RapidBlock fields
- Weather-aware logic
- Full monthly planning

## Next 3 priorities

| Priority | Why it comes next | Success looks like |
|---|---|---|
| 1. KPI/RapidBlock UI handoff | Backend now exposes fields the UI does not yet present | Arnav wires backend truth without inventing state |
| 2. WeatherGuard decision | Weather remains a design-only add-on | One deterministic disruption scenario if approved |
| 3. Monthly planning decision | Monthly is still outside the deviation lock | Add only with a decision-log entry |

## Operational add-ons

### BlockReady

`BlockReady` would sit between schedule generation and final approval. It would capture staff, machinery, materials, permits, isolation, and site access, then mark a block as `READY`, `AT_RISK`, or `NOT_READY`.

Status: not implemented.

### RapidBlock

`RapidBlock` is the emergency block planning idea. The backend now accepts authorised urgent-job requests, creates a derived snapshot, launches a child run, preserves locks, and returns `CANDIDATE_READY`, `REJECTED`, or `NO_CANDIDATE`.

Status: backend implemented; UI not implemented here.

### WeatherGuard

`WeatherGuard` would classify windows as `SAFE`, `CAUTION`, or `BLOCKED` based on weather and work type.

Status: not implemented.

## Recommended delivery order

1. Keep the core upload, validation, planning, explanation, lock, re-plan, approval, and export flow stable.
2. Let Arnav wire KPI and RapidBlock fields if UI time allows.
3. Add one deterministic `WeatherGuard` disruption scenario only after a scope decision.
4. Keep monthly planning out unless Akash records a new decision.
