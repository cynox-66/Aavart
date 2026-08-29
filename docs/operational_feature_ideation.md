# Operational Feature Ideation

This document tracks candidate add-ons for RailNiyojan. They are not part of the locked core scope until the team explicitly approves them.

## Current status

| Area | Status | What exists now | What is missing |
|---|---|---|---|
| Core foundation | Done | Health endpoint, dataset validation, typed API contract, frontend shell, smoke tests | Real planning flow, real persistence, real solver output |
| Planning runs | Not done | Routes exist | `create`, `get`, `lock`, `replan`, `approve`, `export` still return `501 FOUNDATION_NOT_IMPLEMENTED` |
| Demo slice | Partly done | Baseline fixture validation is executable | End-to-end schedule generation and explanation |
| Operational add-ons | Not done | Design notes only | `BlockReady`, `WeatherGuard`, `RapidBlock` are not implemented as product features |

## What matters

- The repo is a scaffold with one real slice: dataset validation.
- The UI is only a shell that reflects backend health.
- Planning is still a stub, so this is not yet a usable railway planning product.
- `RapidBlock` is only an ideation item right now, not shipped behavior.

## What is missing

- Actual planning output
- Solver execution
- Lock and re-plan behavior
- Approval and export behavior
- Weather-aware logic
- Any emergency-planning flow

## Next 3 priorities

| Priority | Why it comes next | Success looks like |
|---|---|---|
| 1. Planning run creation | Without this, there is no product flow, only validation and placeholders | A planning run creates a real plan from the baseline fixture |
| 2. Lock / re-plan / approve / export | These are the core workflow steps after planning | A locked run can be re-planned and exported with audit trail intact |
| 3. One end-to-end demo slice | The repo needs one visible journey, not disconnected endpoints | Upload -> validate -> plan -> explain -> lock -> re-plan works in one demo path |

## Operational add-ons

### BlockReady

`BlockReady` would sit between schedule generation and final approval. It would capture staff, machinery, materials, permits, isolation, and site access, then mark a block as `READY`, `AT_RISK`, or `NOT_READY`.

Status: not implemented.

### RapidBlock

`RapidBlock` is the emergency block planning idea. It is still only an optional extension concept, not production code.

Status: not implemented.

### WeatherGuard

`WeatherGuard` would classify windows as `SAFE`, `CAUTION`, or `BLOCKED` based on weather and work type.

Status: not implemented.

## Recommended delivery order

1. Finish the core upload, validation, planning, explanation, lock, re-plan, approval, and export flow.
2. Add `BlockReady` first if the team wants an operational add-on.
3. Add one deterministic `WeatherGuard` disruption scenario after the core flow is stable.
4. Leave `RapidBlock` for last unless the demo specifically needs emergency-response behavior.
