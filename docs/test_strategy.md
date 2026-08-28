# Test Strategy

## Unit tests

Cover:

- CSV/JSON parsing.
- Pydantic validation.
- Reference and timestamp validation.
- Ruleset loading.
- Reason-code generation.
- Approval and export state transitions.
- RapidBlock actor, request-state, and snapshot/run-lineage validation.

## Solver tests

Cover:

- No incompatible overlap.
- Window and duration bounds.
- Resource, section, isolation, and train-path conflicts.
- Priority objective behavior.
- Lock preservation.
- Infeasibility and timeout states.
- Repeatability with the same seed and fixture.
- RapidBlock uses the unchanged hard constraints and objective ordering.

## Validator tests

The independent validator must catch intentionally corrupted solver output, including an overlap, a moved lock, an out-of-window item, and a stale snapshot.

## API tests

Test every endpoint for valid input, invalid input, missing resources, illegal state transitions, and correct error codes.

For RapidBlock, verify authorised and unauthorised actors, canonical urgent-job validation, unavailable windows, cross-corridor rejection, immutable base snapshots, derived snapshot lineage, child-run lineage, lock conflicts, and normal approval/export enforcement.

## End-to-end tests

At minimum, automate:

1. valid upload to approved export;
2. invalid upload blocked from planning;
3. lock and re-plan preserving the lock;
4. infeasible plan blocked from export;
5. timeout/degraded plan blocked from export.

The optional RapidBlock suite must additionally automate:

1. feasible urgent request to validated candidate;
2. unavailable window rejected without creating a window;
3. lock conflict produces no candidate and preserves the lock;
4. unauthorised actor is rejected before planning;
5. base snapshot and run remain byte-for-byte unchanged.
6. cross-corridor request rejected without broadening planning scope.

## Regression gate

No feature is complete until the relevant acceptance check is automated or explicitly demonstrated and recorded. A changed contract requires updates to fixtures, API tests, and affected role documentation.
