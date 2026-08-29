# Arnav Handoff

Read this first. It is the short version of what changed in the backend so you do not guess wrong in the UI.

## What changed

- Planning run detail now returns KPI summary fields.
- Planning run detail now returns AI estimate evidence with deterministic fallback info.
- RapidBlock backend exists now. The UI surface is still missing.
- SQL-backed persistence exists behind `STORE_BACKEND=sql`.
- Audit events and export records are now stored.

## What the UI can show

- KPI comparison: baseline closure minutes, optimized closure minutes, downtime reduction minutes, and reduction percent.
- AI estimate evidence: `LOCAL_HEURISTIC` or `DETERMINISTIC_FALLBACK`.
- RapidBlock request state: `CANDIDATE_READY`, `REJECTED`, or `NO_CANDIDATE`.
- Base run and child run lineage for RapidBlock.

## What not to do

- Do not invent plan data in the UI.
- Do not label the heuristic AI as validated ML.
- Do not show RapidBlock as fully complete just because the backend exists.
- Do not claim monthly planning or WeatherGuard are implemented. They are not.

## Files worth checking

- `docs/api_contract.md`
- `docs/architecture/solver.md`
- `docs/demo_script.md`
- `docs/operational_feature_ideation.md`
- `docs/project-context/06_progress_tracker.md`
- `docs/test_strategy.md`
