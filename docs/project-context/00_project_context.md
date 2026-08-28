# Team Aavart: Project Context

## Purpose

Team Aavart is building RailNiyojan, a hackathon-grade vertical slice for SIH26027: AI-assisted railway maintenance block planning.

RailNiyojan is the system name. Use `RailNiyojan` consistently in technical documents and presentations.

The demo must ingest controlled maintenance and railway data, validate it, create a planning snapshot, generate a weekly schedule, explain scheduled and unscheduled work, support one manual lock, re-plan unlocked work, and export only an approved valid plan.

## Product position

This is decision support, not an autonomous railway sanctioning system. A solver result never becomes an operational block without human review and approval.

## Scope

- One explicit corridor.
- Weekly planning horizon.
- Controlled CSV/JSON input.
- Deterministic priority, duration bounds, and buffers.
- OR-Tools CP-SAT optimization.
- Visible `Demo Ruleset v1`.
- Planner review, locks, rejects, re-planning, explanations, and audit history.
- CSV/PDF export after validation and approval.

## Out of scope

- Live TMS, SMMS, TDMS, COA, or BDMS integration.
- Network-wide railway topology.
- Automatic sanctioning or operational dispatch.
- Unproven ML claims.
- Monthly planning.
- Kubernetes, high availability, or multi-host production deployment.

## Authority order

When documents conflict, use this order:

1. `docs/01_shared_contract.md`
2. `docs/03_deviation_lock.md`
3. `docs/02_acceptance_checks.md`
4. `docs/04_decision_log.md`
5. Role files under `docs/roles/`
6. Root README and informal chat messages

## Required demo path

Load sample data -> validate -> create snapshot -> run planner -> inspect schedule and reasons -> lock one accepted block -> re-plan unlocked work -> approve -> export.
