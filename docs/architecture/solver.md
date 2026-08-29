# Solver Architecture

## Responsibility

The solver converts a canonical snapshot and versioned ruleset into an explainable weekly candidate plan. It optimizes only after safety and compatibility constraints are represented.

## Stack

- Python
- Google OR-Tools CP-SAT
- pandas or polars for bounded data preparation
- Local heuristic AI estimator for priority or duration inputs

## Inputs

- immutable snapshot ID
- canonical jobs
- assets and sections
- planning windows
- resources
- conflict groups
- isolation zones
- train paths
- `Demo Ruleset v1`
- locked schedule items for re-planning
- deterministic seed
- solver time budget

## Constraint categories

- job assigned at most once;
- scheduled jobs fit inside allowed windows;
- duration stays within configured bounds;
- incompatible resources do not overlap;
- conflicting sections do not overlap;
- isolation zones are respected;
- train-path conflicts are rejected;
- locked items remain unchanged during re-planning.

Priority, risk, and duration estimates are objective inputs. They never override hard safety constraints.

## Objective order

Use this conceptual priority order:

1. satisfy safety and compatibility constraints;
2. preserve locked decisions;
3. schedule high-priority feasible work;
4. maximize useful maintenance coverage;
5. reduce avoidable idle time and fragmentation.

Exact weights belong to `Demo Ruleset v1`; do not scatter them through code.

## Output

Return:

- run state;
- schedule items;
- unscheduled jobs;
- reason codes;
- objective value and bound/gap when available;
- solver version;
- deterministic seed;
- ruleset version;
- validator input.

## Explainability

Every job must receive a reason code. For unscheduled jobs, return the strongest blocking reason and any relevant alternatives. Do not return vague text such as `not possible` without a stable code.

## AI boundary

The local heuristic AI estimator runs before optimization. It may estimate priority or duration only through a defined service boundary. It must include:

- deterministic fallback;
- model/version metadata;
- input lineage;
- timeout/error fallback;
- evaluation evidence before claims are made.
- explicit note that the fallback path is deterministic and not a trained model guarantee.

The demo must work even when estimates fall back to deterministic values.

## Post-solve validation

The independent validator must re-check the candidate plan without trusting the solver's internal assumptions. A failed validator changes the result to invalid for approval/export purposes.

## Failure behavior

- `INFEASIBLE`: show no valid plan and explain the blocking conditions.
- `TIMEOUT`: preserve the best known result for review, mark it degraded, and block approval/export.
- `INVALID`: reject the run and show validation failures.
- `FAILED`: record the error and do not present the run as a plan.
