# Coverage, capacity, and what the planner cannot fit

This document answers one question out loud: **why does the planner schedule 81
of 90 jobs and not all 90?** It exists because the honest answer is a selling
point and the dishonest answer is easy to reach for.

Every number here is measured, not estimated. Reproduce them with the script at
the end.

## The headline

Measured on the weekly horizon, which is the default. Monthly re-scopes the same
snapshot to 30 days and is solved by the same model, so it admits more windows and
more jobs; the properties below hold either way.

| | corridor_1 | corridor_2 |
|---|---|---|
| Jobs scheduled | **81 / 90** (90.0%) | **80 / 90** (88.9%) |
| Maintenance minutes scheduled | 5,340 / 6,075 (87.9%) | 5,250 / 6,075 (86.4%) |
| Section closure used | 1,995 min | 1,935 min |
| Serial baseline (one possession per job) | 5,340 min | 5,250 min |
| **Section closure reduction** | **−62.6%** | **−63.1%** |
| Asset downtime reduction | −30.9% | −36.0% |
| Work done per minute of closure | **2.68×** | 2.71× |
| Window supply consumed | 1,995 of 3,720 min (54%) | 1,935 of 3,720 min (52%) |

The sentence that survives a follow-up question:

> On this corridor the planner places 81 of 90 maintenance jobs — 88% of the
> requested work — and does it inside 1,995 minutes of section closure instead of
> the 5,340 minutes those same jobs would need one possession at a time. That is
> a 63% cut in track occupation, and it comes from working 2.7 jobs' worth of
> maintenance in every closed minute. The nine it cannot place are the nine
> lowest-priority jobs, and each one carries a reason code.

Note what that claim is *not*. It is not "we saved 63% of downtime" measured
against a plan a human wrote — no such plan exists. It is measured against a
named, defensible counterfactual: one possession per job, stacked back to back
within each section. See `backend/src/railniyojan/planning/kpis.py`.

## Why nine jobs do not fit

| Reason code | corridor_1 | corridor_2 |
|---|---|---|
| `RESOURCE_CONFLICT` | 6 | 7 |
| `ISOLATION_CONFLICT` | 3 | 3 |

Prioritisation is doing its job. The unscheduled jobs average priority 53 against
73 for the scheduled ones, and the highest-priority job left out is 73 — well
below the 100 ceiling. Nothing urgent is being dropped so that filler work can
run.

The two causes are real constraints, not tuning:

- **Isolation conflicts.** Twelve isolation zones tie groups of jobs together;
  members of a group cannot share a possession. When a group's work exceeds what
  its windows allow, something in it waits for next week.
- **Resource contention.** All twelve crews have capacity 1, so a crew's jobs are
  strictly serial. Six of the twelve crews finish all of their assigned work;
  the rest run out of window time before they run out of jobs.

> **Known caveat.** `RESOURCE_CONFLICT` is also the catch-all branch in
> `_explain_unscheduled` (`planner.py`), so it currently covers both a genuine
> crew clash and "this job lost a contest for scarce window time". Those are
> different facts and an operator would act on them differently. Splitting them
> into a distinct `CAPACITY_CONTENTION` code is open work.

## Correcting an earlier analysis

An earlier reading of this compared **job-minutes (6,075)** against
**window-minutes (3,486 free after train paths)** and concluded the corridor was
"1.74× oversubscribed" with a hard ceiling near 57% coverage.

**That comparison was invalid**, and the measurements above disprove it: 5,340
job-minutes are now scheduled inside 1,995 closure-minutes.

The error was treating a section possession as consumable by one job at a time.
It is not. Several jobs share one closure — that is the entire premise of
integrated block planning — so job-minutes are bounded by *resource* capacity and
*conflict* structure, never directly by window-minutes. The measured parallelism
is 2.68×, and the corridor still finishes with 46% of its window supply untouched.

Coverage was never capacity-bound. It was bound by a fixture artefact.

## What actually changed

The generator previously pinned every job to exactly one window:

```python
window_slot = (index - 1) % 3 + 1
"allowed_windows": [f"WIN-{prefix}-{section_index:02d}-{window_slot}"],
```

Each 120-minute window was therefore contested by two or three jobs wanting 165
to 225 minutes, with no alternative slot to fall back to. Add 24 train paths per
section fragmenting those windows — eight of the 31 available windows had a
longest free gap of 48 minutes, shorter than the 75-minute median job — and a job
blocked at its single slot was simply lost.

Jobs are now eligible for every window in their own section:

```python
"allowed_windows": list(windows_by_section[section_id]),
```

This is the more realistic model, not a thumb on the scale. Eligibility is a
compatibility fact — can this crew do this work on this section — while
availability is a separate operational one, which is why unavailable slots stay
listed and the solver skips them. Real maintenance work is not welded to a single
possession.

The effect, with no change to the solver, the objective, or the KPI definitions:

| | before | after |
|---|---|---|
| corridor_1 | 44 / 90 (48.9%) | **81 / 90 (90.0%)** |
| corridor_2 | 39 / 90 (43.3%) | **80 / 90 (88.9%)** |
| Section closure reduction (c1) | −29.4% | **−62.6%** |
| `TRAIN_PATH_CONFLICT` rejections (c1) | 19 | **0** |
| `WINDOW_UNAVAILABLE` rejections (c1) | 5 | **0** |

## Plan Quality reads "Feasible", not "Optimal"

This is deliberate and it is correct. `FEASIBLE` means *we found this plan but did
not prove within the time budget that no better one exists*. The architecture
requires that a `FEASIBLE` result is never labelled `OPTIMAL`.

Measured on corridor_1:

| Time budget | Wall time | Status | Jobs | Objective |
|---|---|---|---|---|
| 0.5 s | 0.52 s | FEASIBLE | 81 | 5,919,081 |
| 2 s | 2.01 s | FEASIBLE | 81 | 5,919,081 |
| 10 s | 10.01 s | FEASIBLE | 81 | 5,919,081 |
| 120 s | 43.47 s | **OPTIMAL** | 81 | 5,919,081 |

The plan is found in under half a second and never improves. Everything after
that is spent *proving* optimality, which completes at about 43 seconds and
returns the identical schedule. So the current 10-second
`solver_time_budget_seconds` buys a longer wait and nothing else on this data;
it is kept as a hedge for harder inputs, where extra time could genuinely find a
better plan.

Tests use a 2-second budget for this reason — same schedule, faster CI.

If the "Feasible" label matters more than demo pacing, a ~60-second budget
reaches `OPTIMAL` at the cost of a 43-second wait. That is a presentation
decision, not an engineering one.

## Reproducing all of this

```bash
# regenerate the corridor fixtures
uv run --project backend python backend/scripts/generate_demo_datasets.py

# the coverage and KPI properties asserted in CI
uv run --project backend pytest backend/tests/test_kpis.py -q
```

```python
# the numbers in this document
import json
from railniyojan.contracts.models import DatasetPayload
from railniyojan.optimizer.contracts import OptimizerInput
from railniyojan.optimizer.planner import DeterministicPlanner
from railniyojan.planning.ai import LocalHeuristicEstimator
from railniyojan.planning.kpis import calculate_kpis

dataset = DatasetPayload(**json.load(open("fixtures/generated/corridor_1/dataset.json")))
planned, _ = LocalHeuristicEstimator().estimate(dataset)
output = DeterministicPlanner().solve(
    OptimizerInput(
        run_id="R", snapshot_id="S", ruleset_version="v",
        deterministic_seed=26027, time_budget_seconds=10, dataset=planned,
    )
)
kpis = calculate_kpis(planned, output.schedule_items)
print(kpis.scheduled_jobs, "/", kpis.total_jobs, kpis.closure_reduction_percent)
print(output.unscheduled_reason_codes)
```
