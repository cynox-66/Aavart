# Test Strategy

## Unit tests

Cover:

- CSV/JSON parsing.
- Pydantic validation.
- Reference and timestamp validation.
- Ruleset loading.
- Reason-code generation.
- Approval and export state transitions.

## Solver tests

Cover:

- No incompatible overlap.
- Window and duration bounds.
- Resource, section, isolation, and train-path conflicts.
- Priority objective behavior.
- Lock preservation.
- Infeasibility and timeout states.
- Repeatability with the same seed and fixture.

## Validator tests

The independent validator must catch intentionally corrupted solver output, including an overlap, a moved lock, an out-of-window item, and a stale snapshot.

## API tests

Test every endpoint for valid input, invalid input, missing resources, illegal state transitions, and correct error codes.

## End-to-end tests

At minimum, automate:

1. valid upload to approved export;
2. invalid upload blocked from planning;
3. lock and re-plan preserving the lock;
4. infeasible plan blocked from export;
5. timeout/degraded plan blocked from export.

## Regression gate

No feature is complete until the relevant acceptance check is automated or explicitly demonstrated and recorded. A changed contract requires updates to fixtures, API tests, and affected role documentation.
