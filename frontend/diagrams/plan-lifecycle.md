# Plan Lifecycle Diagram

The complete lifecycle of a planning run from creation to export, including all state transitions, approval gates, and frontend-visible events.

## Plan State Transitions

```mermaid
stateDiagram-v2
    [*] --> SNAPSHOT_CREATED : POST /datasets/validate\n(valid = true)

    SNAPSHOT_CREATED --> RUN_CREATED : POST /planning-runs

    RUN_CREATED --> QUEUED : Optimizer queued
    QUEUED --> RUNNING : Optimizer starts

    RUNNING --> FEASIBLE : Valid schedule found\n(not necessarily optimal)
    RUNNING --> OPTIMAL : Best possible schedule found
    RUNNING --> INFEASIBLE : No valid schedule exists
    RUNNING --> TIMEOUT : Solver hit time limit
    RUNNING --> FAILED : Unexpected error

    FEASIBLE --> INVALID : Independent validator fails
    OPTIMAL --> INVALID : Independent validator fails

    FEASIBLE --> LOCK_APPLIED : POST /lock (job-specific)
    OPTIMAL --> LOCK_APPLIED : POST /lock (job-specific)

    LOCK_APPLIED --> REPLAN_CREATED : POST /replan\n→ New run_id

    REPLAN_CREATED --> RUNNING : New optimization starts

    FEASIBLE --> APPROVED : POST /approve\n(validator passed + human sign-off)
    OPTIMAL --> APPROVED : POST /approve\n(validator passed + human sign-off)

    APPROVED --> EXPORTED : GET /export\n(returns CSV)
```

## Approval Gate Rules

```mermaid
flowchart LR
    subgraph CONDITIONS ["All must be true to Approve"]
        C1["run.state\n= FEASIBLE\nor OPTIMAL"]
        C2["run.validator\n.passed\n= true"]
        C3["run.approval\n= null\n(not yet approved)"]
        C4["UI: isDirty\n= false\n(no unsaved constraints)"]
    end

    CONDITIONS -->|All true| APPROVE_ENABLED["✅ Approve button\nenabled"]
    CONDITIONS -->|Any false| APPROVE_DISABLED["❌ Approve button\ndisabled with tooltip"]
```

## Export Gate Rules

```mermaid
flowchart LR
    subgraph EXPORT_CONDITIONS ["Backend computes export_ready"]
        E1["run.approval\n≠ null"]
        E2["run.state\n∈ {FEASIBLE, OPTIMAL}"]
        E3["run.validator\n.passed = true"]
        E4["snapshot.status\n= 'VALID'"]
    end

    EXPORT_CONDITIONS -->|All true| EXPORT_READY["export_ready = true\n✅ Export button enabled"]
    EXPORT_CONDITIONS -->|Any false| EXPORT_BLOCKED["export_ready = false\n❌ Export button disabled"]
```

## Replan Lineage

```mermaid
flowchart TD
    SNAP["Snapshot SNAP-ABC123\n(immutable)"]

    RUN1["Run RUN-001\nstate: OPTIMAL\nparent_run_id: null"]

    SNAP --> RUN1

    RUN1 -->|POST /lock JOB-042| RUN1_LOCK["Run RUN-001\nJOB-042: locked = true"]

    RUN1_LOCK -->|POST /replan| RUN2["Run RUN-002\nstate: FEASIBLE\nparent_run_id: RUN-001\nJOB-042: PRESERVED\nJOB-015: CHANGED\nJOB-033: CHANGED"]

    RUN2 -->|POST /approve| APPROVED["Run RUN-002\napproval: {reviewer, comment, timestamp}"]

    APPROVED -->|GET /export| CSV["Exported CSV\nrun_id: RUN-002"]
```

## RapidBlock Lineage

```mermaid
flowchart TD
    SNAP_ORIG["Original Snapshot\nSNAP-ABC123"]
    RUN_ORIG["Approved Run RUN-001\n(currently active plan)"]

    SNAP_ORIG --> RUN_ORIG

    RUN_ORIG -->|POST /rapidblock-requests| RB_REQUEST["RapidBlock Request\nrequestId: RBR-001\nstate: VALIDATING → CANDIDATE_READY"]

    SNAP_DERIVED["Derived Snapshot\nSNAP-XYZ789\n(parent: SNAP-ABC123)\n(includes emergency job)"]

    RB_REQUEST --> SNAP_DERIVED

    RUN_CHILD["Child Run RUN-002\nparent_run_id: RUN-001\ntrigger_type: RAPIDBLOCK\nEmergency job: SCHEDULED\nN other jobs: CHANGED"]

    SNAP_DERIVED --> RUN_CHILD

    RUN_CHILD -->|POST /approve| EMRG_APPROVED["Child Run RUN-002\nEmergency Approved"]
```
