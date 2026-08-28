# SIH26027 Risk Review

## Bottom Line

The architecture is suitable as a hackathon decision-support prototype, but it is not ready to claim operational Railway execution.

The main risk is not CP-SAT or PostgreSQL. The main risk is that the solver can optimize incomplete or incorrect Railway rules and still return a technically feasible plan.

## Risk Classification

### Verified From The Architecture PDF

These are directly stated or clearly visible gaps in the PDF. They are verified as architecture gaps, not as live production failures.

| Risk | Evidence | How it can fail | Hackathon treatment |
|---|---|---|---|
| Railway block legality is unresolved | The PDF says exact legal block/disconnection definitions must be validated with Railway experts. | The solver schedules work that is mathematically feasible but cannot be legally sanctioned. | Use a small fixed demo ruleset and label it `Demo Ruleset v1`. |
| Source-system authority is unresolved | The PDF says TMS, SMMS, TDMS, COA and BDMS interfaces and authoritative fields still need validation. | Conflicting or stale values enter one snapshot and the solver treats them as truth. | Use one controlled input contract and show source freshness/status. |
| Asset and section mapping is unresolved | The PDF requires a source identity table but provides no verified mapping dataset. | A job may be attached to the wrong section, asset or isolation zone. | Use stable demo IDs and reject unresolved references. |
| Real resource data is unresolved | The PDF asks whether crew and machine availability exists in a source system and at what granularity. | The schedule assumes a crew or machine is available when it is not. | Use explicit synthetic resources and hard capacity limits. |
| Operational approval semantics are unresolved | The BDMS write semantics and approval workflow are listed as validation items. | A generated plan cannot be safely handed off or sanctioned. | Export only a recommendation; require human approval before export. |
| Prototype evidence is synthetic or controlled | The PDF explicitly allows CSV/JSON snapshots and synthetic maintenance data for the SIH demo. | A successful demo proves the pipeline works, not that real Railway data works. | Include a visible synthetic-data warning and a conflict scenario. |
| No measurable acceptance targets are defined | The PDF suggests scenario-specific performance targets but does not provide pass/fail thresholds. | The team can claim success without proving validity, quality or reliability. | Define concrete demo tests before implementation. |
| Monthly planning is not executable detail | The PDF makes monthly output a soft preference or capacity reservation for weekly planning. | Weekly plans repeatedly override monthly intent, making long-range planning unreliable. | Implement weekly planning only; defer monthly planning. |

### Verified By Official Documentation

These are real Railway or solver requirements that expose where the PDF is incomplete.

| Verified fact | Source | Impact on this architecture |
|---|---|---|
| Railway work affecting running lines can require line blocks and Special Working Rules. | [Indian Railways General Rules, Chapter XV](https://indianrailways.gov.in/railwayboard/uploads/directorate/safety/SR_SR/SR_SR_CHAP15.PDF) | A candidate time window is not equivalent to an authorized block. |
| Engineering, signalling and traction work requires coordination and formal operating procedures. | [Indian Railways Training Module](https://er.indianrailways.gov.in/cris/uploads/files/1747221477683-Matter%20-%20Training.pdf) | Co-location compatibility cannot be reduced to only spatial and temporal overlap. |
| Traction work can require a traffic block, power block and permit-to-work, with an unambiguous section description. | [Indian Railways AC Traction Manual](https://eastcoastrail.indianrailways.gov.in/uploads/files/1697451258367-ACTM%20VOLUME-II_PART-1.pdf) | The planner must not represent solver output as permission to start work. |
| OR-Tools `FEASIBLE` means a feasible result was found, not that it is optimal. `UNKNOWN` can occur after a time or memory limit. | [OR-Tools CP-SAT documentation](https://developers.google.com/optimization/cp/cp_solver) | A time-limited result must carry a visible quality flag and must not be presented as the best plan without qualification. |

### Plausible Failure Modes, Not Proven In This Project

These are reasonable engineering risks, but there is no evidence in the PDF or current implementation that they have already occurred.

| Risk | How it can fail | Required proof |
|---|---|---|
| Source data disagreement | One source says a section is free while another contains a restriction. | Build a conflicting-source fixture and define precedence or quarantine behavior. |
| Wrong cross-system identity mapping | Different IDs refer to the same asset, or one ID is mapped to the wrong physical location. | Test a mapping table with duplicates, aliases and unresolved IDs. |
| Duration underestimation | Predicted work time excludes setup, protection, restoration or access delays. | Compare estimates against historical actuals or use explicit buffers in the demo. |
| Live timetable deviation | The static timetable misses late trains, freight changes or control-room decisions. | Add a changed-occupancy re-plan test. |
| Re-plan churn | An emergency job changes too many accepted assignments or creates boundary conflicts. | Lock accepted jobs and measure how many unlocked jobs move. |
| Weak explanations | A generic reason code hides the real cause, such as missing or incorrect rules. | Show the exact violated constraint and the rejected alternatives. |
| Optimizer scaling failure | The model times out or returns a weak feasible plan as the number of jobs and windows grows. | Record job count, windows, variables, runtime, status and objective gap. |

## How The Hackathon Version Differs From The PDF

We are narrowing and hardening the PDF, not changing its core architecture.

| PDF target | Hackathon implementation |
|---|---|
| Multiple real Railway source adapters | One controlled CSV/JSON adapter |
| Full Railway topology | One small explicit corridor graph |
| ML priority and duration services | Deterministic rules first; ML is optional |
| Weekly and monthly planning | Weekly planning only |
| Configurable production rule library | Fixed, visible `Demo Ruleset v1` |
| Candidate/approved plan path | Recommendation -> human review -> approval -> export |
| Solver output as the main result | Solver output plus independent safety validator |
| Best feasible result may be returned | `FEASIBLE`, `UNKNOWN`, stale data and fallback states are visible |
| BDMS integration later | No sanctioning integration; export recommendation only |
| Production identity, HA and observability | Basic local RBAC, run history and audit trail |
| Broad regional emergency re-plan | Re-plan only unlocked jobs in the demo corridor |

## Mandatory Demo Guardrails

1. Reject jobs missing section, duration, isolation, resource or dependency data.
2. Reject or quarantine stale and conflicting input instead of silently planning it.
3. Run an independent post-solve validator for overlap, isolation, resource, dependency and buffer rules.
4. Prevent export when validation fails, input is degraded, or the solver status is unsafe.
5. Include one deliberate infeasible scenario and explain why it was rejected.
6. Show every scheduled and unscheduled job with reason codes.
7. Display this warning on every result: `Synthetic data. Demonstration ruleset. Human approval required. Not for operational sanctioning.`

## Demo Acceptance Tests

- Clean input produces a schedule.
- Same-section jobs do not overlap.
- Incompatible S&T/TRD work is rejected.
- Missing safety fields prevent scheduling.
- Stale input produces `DEGRADED` status.
- Infeasible input produces an escalation, not a fabricated schedule.
- A locked block survives re-planning.
- An invalid plan cannot be exported.
- A `FEASIBLE` result displays a non-optimality warning.

## What Is Not A Red Flag By Itself

The following choices are reasonable and do not need to be changed for the hackathon:

- CP-SAT as the scheduling engine.
- PostgreSQL/PostGIS as the data store.
- Immutable planning snapshots.
- Human-in-the-loop approval.
- Rule-based fallback when ML is unavailable.

They become dangerous only when the input data or Railway constraints are wrong.
