# 01 — Product Overview

## What is RailNiyojan?

RailNiyojan is a **weekly railway maintenance planning system** for Indian Railways. It coordinates maintenance work across three historically siloed departments — Track (TMS), Signal (SMMS), and Traction/Electrical (TDMS) — and produces an integrated, conflict-free maintenance schedule using a constraint-based optimizer.

The system uses **Google OR-Tools CP-SAT** (Constraint Programming - Satisfiability) to solve the scheduling problem mathematically. A local heuristic AI layer adjusts priority and duration estimates before the optimizer runs. An independent safety validator then verifies the output before a human can approve and export the plan.

---

## The Problem Being Solved

Indian Railways maintenance departments historically plan in isolation. This creates:

- **Spatial conflicts**: Two departments block the same track section simultaneously.
- **Temporal conflicts**: Jobs overlap in windows where trains are passing.
- **Resource conflicts**: The same maintenance crew is allocated to two jobs at the same time.
- **Missed opportunities**: Departments could share a joint possession block (reducing total disruption) but do not because they do not coordinate.

RailNiyojan solves this by ingesting data from all three departments into a single canonical snapshot, then running a joint optimizer that respects safety constraints, train timetable conflicts, and resource limits — producing a single weekly plan that reduces total track closure time compared to the uncoordinated baseline.

The key measurable win: **downtime reduction percentage** (`downtime_reduction_percent` in the KPI response). This is the number judges and operators care about most.

---

## Target User

**Primary user**: A Divisional Manager or Senior Planner in an Indian Railway division (e.g., WR - Vadodara).

Their workflow:
1. They receive maintenance job requests from TMS, SMMS, and TDMS.
2. They upload or import this data into RailNiyojan.
3. The system validates the data and generates an optimized plan.
4. They review the plan, inspect individual jobs, optionally lock priority items, and request re-optimization if needed.
5. They approve the final plan with a digital sign-off.
6. They export or share the approved plan for field execution.

**Emergency user**: An authorized PLANNER who needs to inject an urgent job (e.g., emergency rail fracture repair) into an already-approved plan via the RapidBlock mechanism.

---

## Core Concepts Glossary

| Term | Definition |
|------|-----------|
| **Snapshot** | An immutable, validated copy of the input dataset. Identified by a deterministic hash-based ID (e.g., `SNAP-ABC123`). Cannot be changed once created. |
| **Planning Run** | A single execution of the optimizer against a snapshot. Produces a schedule, reason codes, KPIs, and validator results. Identified by `run_id`. |
| **Schedule Item** | A single job assignment in the plan: which job, which window, what time, what status. |
| **Job** | A single maintenance task (e.g., "replace rail on section ST-03"). Has priority, duration, required resources, and allowed windows. |
| **Window** | A defined time slot when maintenance work is permitted on a section (i.e., no trains running). |
| **Section** | A segment of the railway corridor (e.g., AKW–BHU, BRC–VDA). |
| **Possession** | An authorized block of time when a section is taken out of traffic service for maintenance. |
| **Integrated Block** | When multiple departments share a single possession window — the key efficiency gain. |
| **Lock** | A planner-placed constraint that pins a specific job to its current schedule slot. Locked jobs are preserved during re-optimization. |
| **Replan** | Re-running the optimizer while keeping locked items fixed. Returns a new run with a new `run_id`. |
| **RapidBlock** | An emergency mechanism for injecting an urgent job into a currently active plan. Bypasses the normal 5-step wizard. |
| **KPI** | Key Performance Indicators: baseline vs. optimized closure minutes, downtime reduction percentage, scheduled vs. rejected maintenance time. |
| **Reason Code** | A machine-readable explanation for why a job was scheduled at a particular time, or why it was rejected. Example: `PRIORITY_FIT`, `TRAIN_PATH_CONFLICT`, `LOCK_PRESERVED`. |
| **AI Estimate** | A local heuristic pre-pass that adjusts job priority and duration before the CP-SAT solver runs. Source is `LOCAL_HEURISTIC` or `DETERMINISTIC_FALLBACK`. |
| **Approval** | A human sign-off on a planning run. Required before export is unlocked. |
| **Export** | A CSV download of the approved schedule. Only available after approval + validator pass + feasible state. |

---

## Core Planning Workflow (The Happy Path)

```
Upload dataset (CSV or JSON)
    ↓
Validate dataset → receives snapshot_candidate_id
    ↓
Create planning run → optimizer runs → receives run_id
    ↓
Review plan (inspect jobs, reason codes, KPIs)
    ↓
[Optional] Lock priority jobs
    ↓
[Optional] Re-optimize around locks
    ↓
Approve plan (human sign-off)
    ↓
Export plan (CSV download, now unlocked)
```

---

## Emergency Workflow (RapidBlock)

```
An incident occurs (e.g., rail fracture at km 512)
    ↓
Operator opens Emergency Rapid-Block Mode
    ↓
Fills in: incident type, section, duration, notes
    ↓
System submits urgent job to POST /rapidblock-requests
    ↓
Backend creates derived snapshot + child planning run
    ↓
Returns: cascade impact (jobs rescheduled, trains delayed)
    ↓
Operator reviews impact on corridor map
    ↓
Operator approves emergency dispatch
    ↓
[Optional] Export emergency plan
```

---

## What the System Does NOT Do

- It does not connect to live TMS, SMMS, or TDMS systems in the current version.
- It does not grant railway operational authority — the output is a **candidate recommendation**.
- It does not run monthly planning (weekly only in the current scope).
- It does not manage train scheduling — it works *around* existing train paths.
- It is not a real-time control system.

---

## Domain Reference

For full domain terminology, see [`docs/domain_glossary.md`](../../docs/domain_glossary.md).
For project context and SIH problem statement, see [`docs/project-context/`](../../docs/project-context/).
