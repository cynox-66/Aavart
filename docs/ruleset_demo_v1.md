# Demo Ruleset v1

This is the fixed, visible hackathon ruleset. It is not a legal railway rule library.

## Hard constraints

- A job is assigned at most once.
- A job must fit inside an allowed available window.
- A job must fit within its duration bounds.
- Jobs sharing a required resource cannot overlap.
- Jobs on the same conflicting section cannot overlap.
- Jobs sharing an isolation zone cannot overlap.
- Maintenance cannot overlap a conflicting train path.
- Locked schedule items cannot move or disappear during re-planning.

## Objective priorities

Use lexicographic intent, implemented with documented weights if CP-SAT requires a scalar objective:

1. satisfy all hard constraints;
2. preserve locked items;
3. maximize scheduled priority score;
4. maximize total scheduled jobs;
5. minimize unused gaps and fragmentation.

Priority is an integer from 0 to 100. It is not a safety override.

## Deterministic baseline

- Use supplied priority values.
- Use nominal duration for the first run.
- Use min/max bounds for feasibility checks.
- Use fixed setup and restoration buffers from the sample scenario.
- Use a fixed deterministic seed.

## ML policy

ML is disabled by default. If a provider is unavailable, times out, or returns invalid output, use deterministic values and record the fallback event.

## Approval policy

Approval and export are blocked for invalid, stale, unsafe, failed, infeasible, or timed-out/degraded results.

## Versioning

Every run records exactly `Demo Ruleset v1`. Changing a rule requires a new ruleset version and a decision-log entry.
