# Akash: Backend and Integration

## Own

- API and service boundaries.
- Dataset validation and snapshot creation.
- Run lifecycle, approval, export guardrails, and audit records.
- Final integration and merge decisions.

## Must implement

- The operations in `docs/project-context/01_shared_contract.md`.
- Stable error codes and messages.
- Rejection of invalid or stale data.
- Approval before export.
- Independent post-solve validation integration.
- RapidBlock request validation, demo-actor allowlist, derived snapshot creation, child-run lineage, and audit events.

## Must not implement

- Live railway integrations.
- Automatic sanctioning.
- New schema fields without a contract decision.
- Solver-specific business rules hidden in API code.

## Done when

Acceptance checks for validation, snapshots, approval, export, auditability, and the optional RapidBlock backend path pass.
