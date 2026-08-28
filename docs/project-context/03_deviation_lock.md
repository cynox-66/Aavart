# Deviation Lock

These are approved SIH simplifications. Team members must not expand scope without recording a decision and getting integration-owner approval.

## Approved deviations

- Controlled CSV/JSON replaces live railway adapters.
- One explicit corridor replaces the full railway network.
- Deterministic priority and duration are used first; ML is optional and non-blocking.
- Weekly planning is implemented; monthly planning is not.
- `Demo Ruleset v1` is fixed and visible.
- No BDMS write integration is implemented.
- Single-host deployment is acceptable.
- Re-planning is limited to affected and unlocked jobs.
- Independent post-solve validation blocks unsafe export.
- RapidBlock is an optional extension that creates a derived snapshot and child run; it does not replace the mandatory core flow.

## Forbidden deviations

- Do not remove human approval before export.
- Do not treat solver output as legal or operational authority.
- Do not silently change canonical field names or status values.
- Do not add live integrations during the hackathon demo.
- Do not add ML that changes behavior without a deterministic fallback.
- Do not remove reason codes, snapshots, locks, audit history, or validation.
- Do not broaden to network-wide planning.
- Do not claim production readiness.
- Do not label a RapidBlock candidate as `GRANTED`, `SANCTIONED`, or operationally available.
- Do not let urgency override locks, safety constraints, validation, approval, or export rules.

## Change rule

Any proposed deviation must state: problem, proposed change, affected files, demo impact, risk, owner, and approval. Until approved, the existing contract remains binding.
