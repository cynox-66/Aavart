# Integration Rules

## Ownership

- Akash owns integration, backend contracts, final merge, and conflict resolution.
- Dev Jaiswal owns solver behavior and optimization tests.
- Arnav Gogia owns frontend behavior and API consumption.
- Mohit Ray owns visual design and assets.
- Aadi Shah owns research, sample data, and assumption validation.
- Sakshi Raghuwanshi owns the presentation and demo narrative.

## Required before merge

- Read the shared contract and deviation lock.
- Use the canonical field names and statuses.
- Add or update an acceptance check for user-visible behavior.
- Test with the shared sample data format.
- Document any new decision or assumption.
- Report what was tested and what remains unverified.

## Merge rules

- Do not rewrite another role's implementation without coordination.
- Do not merge contract changes as incidental refactors.
- Do not hide incompatible assumptions in frontend mocks or solver code.
- Prefer small vertical slices that can be integrated and demoed.
- Integration owner resolves conflicts; unresolved conflicts block merge.

## Handoff format

```text
Completed:
Changed files:
Contract impact:
Acceptance checks:
Test command/results:
Known limitations:
Next dependency:
```
