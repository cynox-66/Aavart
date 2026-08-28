# Security and Safety

## Product boundary

The system is decision support. It does not issue railway authority, dispatch trains, or write sanctions to BDMS.

## Safety rules

- Hard constraints are evaluated before objective preferences.
- Independent validation is mandatory before approval.
- Invalid, stale, failed, infeasible, and timed-out/degraded results cannot be approved or exported.
- Locked decisions are immutable within a re-plan.
- All approvals and exports are auditable.

## Access rules

For the hackathon, use a simple planner identity if full identity integration is unavailable. Still record actor identity on locks, approvals, exports, and administrative changes.

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

## Threats to address

- Tampered input: detect with validation and snapshot hashing.
- Stale data: compare snapshot freshness before approval/export.
- UI bypass: enforce approval/export rules in the backend.
- Solver defect: use independent post-solve validation.
- Misleading presentation: expose solver state, assumptions, and limitations.
