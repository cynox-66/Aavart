# Review Plan State Machine

The complete interaction diagram for the Review Plan screen (Step 4).

## Job Selection Synchronization

When a user selects a job from any of the three components (Gantt, Map, Explorer), all components update:

```mermaid
sequenceDiagram
    participant User
    participant Gantt as Weekly Timeline\n(Gantt Chart)
    participant Map as Corridor Overview\n(Map)
    participant Explorer as Job Explorer\n(Left Panel)
    participant Inspector as Job Inspector\n(Right Panel)
    participant State as selectedJobId\n(Shared State)

    User->>Gantt: Clicks JOB-042 bar
    Gantt->>State: setSelectedJobId("JOB-042")
    State-->>Gantt: Re-render: highlight JOB-042 bar
    State-->>Map: Re-render: highlight section AKW-BHU
    State-->>Explorer: Re-render: scroll to + highlight JOB-042
    State-->>Inspector: Re-render: show JOB-042 details

    User->>Map: Clicks AKW-BHU section
    Map->>State: setSelectedJobId(first job in section)
    State-->>Gantt: Re-render: highlight job bar
    State-->>Inspector: Re-render: update job details

    User->>Inspector: Clicks ">" next job arrow
    Inspector->>State: setSelectedJobId(nextJobId)
    State-->>Gantt: Re-render: new highlight
    State-->>Map: Re-render: new section highlight
```

## Lock and Re-Optimize Flow

```mermaid
stateDiagram-v2
    [*] --> PLAN_UP_TO_DATE : Plan loaded from GET /planning-runs

    PLAN_UP_TO_DATE --> INSPECTING : User selects a job
    INSPECTING --> PLAN_UP_TO_DATE : User deselects / closes inspector

    INSPECTING --> LOCKING : User clicks Lock in Schedule
    LOCKING --> LOCK_SUCCESS : POST /lock returns 200
    LOCKING --> LOCK_FAILED : POST /lock returns error

    LOCK_FAILED --> INSPECTING : Show error toast, stay on same job

    LOCK_SUCCESS --> UNSAVED_CONSTRAINTS : isDirty = true\nRe-Optimize panel activates\nApprove Plan button disables

    UNSAVED_CONSTRAINTS --> REOPTIMIZING : User clicks Re-Optimize Plan
    UNSAVED_CONSTRAINTS --> INSPECTING : User inspects another job (can lock more)

    REOPTIMIZING --> PLAN_UPDATED : POST /replan returns new run_id\nGET /planning-runs/new_id succeeds
    REOPTIMIZING --> REOPTIMIZE_FAILED : POST /replan returns INFEASIBLE\nor network error

    PLAN_UPDATED --> PLAN_UP_TO_DATE : isDirty = false\nNew schedule rendered\nApprove Plan button re-enables

    REOPTIMIZE_FAILED --> UNSAVED_CONSTRAINTS : Preserve previous plan\nShow error panel\nOffer Retry

    PLAN_UP_TO_DATE --> APPROVING : User clicks Approve Plan →
    APPROVING --> APPROVED : POST /approve returns 200
    APPROVING --> PLAN_UP_TO_DATE : POST /approve returns error\nShow inline error

    APPROVED --> [*] : Navigate to Plan Approved screen
```

## Global Re-Optimize Panel States

```mermaid
flowchart TD
    S1["STATE: PLAN_UP_TO_DATE
    ─────────────────────────
    PLAN STATUS
    Plan is up to date.
    No re-optimization needed.
    ─────────────────────────
    [Approve Plan →] ENABLED"]

    S2["STATE: UNSAVED_CONSTRAINTS
    ─────────────────────────
    ⚠️ GLOBAL ACTION
    You have locked N job(s).
    The plan must be recalculated.

    [🔄 Re-Optimize Plan]
    ─────────────────────────
    [Approve Plan →] DISABLED
    tooltip: 'Re-optimize first'"]

    S3["STATE: REOPTIMIZING
    ─────────────────────────
    ⚙️ GLOBAL ACTION
    Re-Optimizing...
    Preserving N locked job(s).

    [⚙️ Optimizing...] DISABLED
    ─────────────────────────
    Gantt: shimmer blur (unlocked)
    Locked jobs: solid, no blur
    Map: pulsing opacity"]

    S4["STATE: REOPTIMIZE_FAILED
    ─────────────────────────
    ❌ GLOBAL ACTION
    Re-Optimization Failed.
    Check conflicting locks.

    [🔄 Retry Re-Optimize]
    ─────────────────────────
    Previous plan preserved
    Conflicting jobs: red highlight"]

    S5["STATE: PLAN_UPDATED
    ─────────────────────────
    (briefly shown, then transitions)
    ✅ Re-optimization complete!
    N jobs shifted.
    ─────────────────────────
    Gantt: animate bars to new pos
    KPIs: numbers flash (green/amber)
    Toast: '✅ Re-optimization complete'"]

    S1 -->|User locks a job\nPOST /lock success| S2
    S2 -->|User clicks Re-Optimize| S3
    S3 -->|POST /replan success\nnew run loaded| S5
    S3 -->|POST /replan fails\nor new run = INFEASIBLE| S4
    S4 -->|User retries| S3
    S5 -->|500ms delay| S1
```

## Approve Plan Guard

```mermaid
flowchart TD
    USER["User clicks [Approve Plan →]"]
    USER --> CHECK1{isDirty?}
    CHECK1 -->|Yes| BLOCK1["❌ Blocked
    'Re-optimize the plan
    before approving'
    Button stays disabled"]
    CHECK1 -->|No| CHECK2{run.validator.passed?}
    CHECK2 -->|No| BLOCK2["❌ Blocked
    'Safety validation failed'"]
    CHECK2 -->|Yes| CHECK3{run.approval === null?}
    CHECK3 -->|No — already approved| REDIRECT["Redirect to
    Plan Approved screen"]
    CHECK3 -->|Yes| CHECK4{state = FEASIBLE or OPTIMAL?}
    CHECK4 -->|No| BLOCK4["❌ Blocked
    'Plan is not in an
    approvable state'"]
    CHECK4 -->|Yes| STEP5["Navigate to
    Step 5: Approve Plan
    (sign-off form)"]
```
