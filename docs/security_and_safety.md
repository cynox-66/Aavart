# Security and Safety

## Product boundary

The system is decision support. It does not issue railway authority, dispatch trains, or write sanctions to BDMS.

## Safety rules

- Hard constraints are evaluated before objective preferences.
- Independent validation is mandatory before approval.
- Invalid, stale, failed, infeasible, and timed-out/degraded results cannot be approved or exported.
- Locked decisions are immutable within a re-plan.
- All approvals and exports are auditable.
- RapidBlock urgency never overrides locks, hard constraints, independent validation, approval, or export rules.
- A RapidBlock candidate is not an operational grant, sanction, permit, or authority to occupy the line.

## Access rules

For the hackathon, use a simple planner allowlist if full identity integration is unavailable. Still enforce the allowlist in the backend and record actor identity on RapidBlock requests, locks, approvals, exports, and administrative changes.

## Data handling

- Use synthetic or controlled sample data.
- Do not commit credentials, tokens, or real railway operational data.
- Keep uploaded files tied to a snapshot hash.
- Do not overwrite prior snapshots or approved runs.

## Audit requirements

Record actor, timestamp, run ID, snapshot ID, ruleset version, action, and relevant before/after values for:

- validation;
- planning;
- lock;
- re-plan;
- approval;
- export;
- failure.
- RapidBlock submission, rejection, derived snapshot creation, child-run creation, and candidate result.

## Threats to address

- Tampered input: detect with validation and snapshot hashing.
- Stale data: compare snapshot freshness before approval/export.
- UI bypass: enforce approval/export rules in the backend.
- Solver defect: use independent post-solve validation.
- Misleading presentation: expose solver state, assumptions, and limitations.
