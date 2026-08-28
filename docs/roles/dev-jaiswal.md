# Dev Jaiswal: Solver and AI

## Own

- CP-SAT model.
- Compatibility, resource, section, isolation, and train-path constraints.
- Deterministic priority and duration behavior.
- Solver status, reason codes, and post-solve validation inputs.

## Must implement

- Preserve locked items during re-planning.
- Return scheduled and unscheduled jobs.
- Explain every scheduling decision with stable reason codes.
- Distinguish feasible from optimal results.
- Fail safely on timeout, infeasibility, and invalid input.
- Process RapidBlock child runs through the unchanged ruleset and report lock or window conflicts using contract reason codes.

## Must not implement

- ML as a required dependency.
- Constraints that contradict the shared contract.
- Silent fallback that makes an unsafe plan look valid.
- Network-wide topology.
- RapidBlock-specific safety overrides, hidden priority boosts, or lock bypasses.

## Done when

Constraint, reason-code, lock, re-plan, and solver-status acceptance checks pass on deterministic sample data.
