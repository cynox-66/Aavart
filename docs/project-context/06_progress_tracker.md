# Progress Tracker

This file is the working tracker for the team.

## Strict rule

- After every feature, bugfix, contract change, or doc change that affects the demo, the person doing the work must stop and read this tracker before starting the next task.
- No one may skip this step because they are using AI.
- No one may begin the next item until the tracker is updated and the next dependency is clear.
- Only the owner updates this file.
- If a task changes the contract, the tracker must point to the decision log entry and the affected acceptance checks.

## Ownership

- Tracker owner: Akash
- Integration owner: Akash
- Rule: everyone reads, only Akash edits

## Current focus

| Item | Owner | Status | Notes |
|---|---|---|---|
| Shared contract lock | Akash | done | Contract and deviation rules already exist |
| Progress tracker | you | active | This file |
| Backend foundation | Akash | in progress | Validation exists; planning routes are still stubs |
| Solver core | Dev Jaiswal | pending | Needs real planning behavior and reason codes |
| Frontend shell | Arnav | pending | Must show backend truth only |
| Sample data and fixtures | Aadi | pending | Must support every acceptance check |
| UI/assets polish | Mohit | pending | Keep labels aligned with contract |
| Demo script | Sakshi | pending | Must follow the real flow, not a fake one |

## Working cycle

1. Read the tracker.
2. Read the shared contract and role file.
3. Do one narrow task.
4. Run the relevant tests.
5. Record what changed.
6. Stop.
7. Read the tracker again before starting the next task.

## Status values

- `pending`
- `in progress`
- `blocked`
- `done`

## Minimum handoff

```text
Completed:
Changed files:
Contract impact:
Acceptance checks:
Test command/results:
Known limitations:
Next dependency:
```
