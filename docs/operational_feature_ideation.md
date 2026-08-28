# Operational Feature Ideation

This document records candidate add-ons discussed for RailNiyojan. They are not part of the locked core scope until approved through the project decision process.

## Real-world problem

A solver can propose a feasible block, but railway Operations may not grant or execute it because of live train movement, missing staff or equipment, incomplete isolation, weather, emergencies, or local site conditions. RailNiyojan must remain a decision-support system; it does not sanction an operational railway block.

## BlockReady

`BlockReady` is the short name for the Block Readiness and Commitment System.

It sits between schedule generation and final approval. Each required department confirms staff, machinery, materials, permits, isolation, and site access. The block is shown as `READY`, `AT_RISK`, or `NOT_READY`, while Operations records `PROVISIONALLY_ACCEPTED`, `GRANTED`, `DELAYED`, or `DENIED`.

A delayed or denied block requires a stable reason code. Re-planning creates a new audited run instead of silently modifying the original plan.

Primary measures are requested block hours, granted block hours, utilised block hours, cancellation reasons, completion, and overrun.

## RapidBlock

`RapidBlock` is the short name for emergency block planning.

Status: approved as an optional extension by `DEC-003`; it is not part of the mandatory five-minute core flow.

It allows an authorised demo planner to submit one canonical urgent job against an existing planning run. The backend records the actor and justification, validates the job and requested controlled windows, creates a derived immutable snapshot, and launches a child run for affected unlocked work.

RapidBlock reuses `Demo Ruleset v1`. It does not add a special solver, hidden priority boost, new operational window, lock override, safety override, automatic approval, or automatic export. Compatible work from multiple departments may share a planning window; department identity alone neither forces separation nor proves compatibility.

The request must remain inside the base run's one-corridor snapshot. It produces either a validated `CANDIDATE_READY` comparison or stable failure reasons such as `ACTOR_NOT_AUTHORIZED`, `NO_ELIGIBLE_WINDOW`, `LOCK_CONFLICT`, or `OUTSIDE_PLANNING_SCOPE`. It never returns `GRANTED`, `SANCTIONED`, or authority to use the line.

Required audit lineage is: request -> base run and snapshot -> derived snapshot -> child run -> validator result -> optional human approval and recommendation export.

## WeatherGuard

`WeatherGuard` is the short name for weather-aware block planning.

It evaluates weather by section, time, and work type. Planning windows are classified as `SAFE`, `CAUTION`, or `BLOCKED`. Blocked windows reject weather-sensitive work; caution windows are less preferred; weather-independent work remains eligible.

Forecast confidence, source time, and freshness must be visible. Weather affecting a locked block triggers human review and blocks approval or export; it must never move the block silently. Demo thresholds and controlled weather data must not be presented as official railway safety rules.

## Recommended delivery order

1. Complete the core upload, validation, planning, explanation, lock, re-plan, approval, and export flow.
2. Add `BlockReady` as the first operational add-on.
3. Add one deterministic `WeatherGuard` disruption scenario.
4. Add the optional `RapidBlock` extension only after the core demo is stable; keep its separate demonstration within 60-90 seconds.
