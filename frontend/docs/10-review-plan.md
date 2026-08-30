# 10 — Review Plan Screen (Detailed Specification)

The Review Plan screen (Step 4) is the most important and complex screen in the application. This document specifies it in full detail.

---

## Layout Overview

```text
+---------------------------------------------------------------+---------------+
| WorkflowStepper: 1. Select Data | 2. Check Data | 3. Create Plan | 4. Review Plan (active) | 5. Approve Plan |   User Profile |
+---------------------------------------------------------------+---------------+
|                                                               |               |
|  CORRIDOR OVERVIEW                          [View on Map] [⛶] | JOB INSPECTOR |
|  +----------------------------------------------------------+  |               |
|  |  BRC -------- VDA -------- AKW -------- BHU -------- SUR |  |  JOB-042      |
|  |  ( )          ( )          (●)          (●)          ( ) |  |  High Priority|
|  |                             ~~~~ [RESTRICTED] ~~~~        |  |               |
|  |  BRC–VDA:Clear  VDA–AKW:Caution  AKW–BHU:Restricted  ... |  |  Department   |
|  +----------------------------------------------------------+  |  Section      |
|                                                               |  Location     |
|  WEEKLY TIMELINE       [18 Aug – 24 Aug 2026]  [Expand ↗]   |  Duration     |
|  +----------------------------------------------------------+  |  Window       |
|  | Section | Mon | Tue | Wed | Thu | Fri | Sat | Sun        |  |  Reason       |
|  | ST-01   | [██████]  |     |     |     |     |            |  |               |
|  | ST-02   |      [████████]  |     |     |     |           |  | WHY THIS TIME?|
|  | ST-03   |           [██] [██] [██]    |     |            |  | ✓ Window avail|
|  +----------------------------------------------------------+  | ✓ Signal compat|
|                                                               | ✓ Safety prior|
|  PLAN IMPACT (vs. previous plan)                             |               |
|  [ ⏱ Closure -36% ]  [ 🔧 Possessions -60% ]  [ ✅ Optimal ] | ACTIONS       |
|  [ View Detailed Comparison → ]                              | [🔒Lock]  [🕒Wnd]|
|                                                               | [🗑️Excl] [🔀Alt]|
|  Task Summary: [26 Total] [1 Integrated Block] [9 Selected]  |               |
|                                                               | GLOBAL ACTION |
+---------------------------------------------------------------+ [⚠️ Reoptimize]|
| [📥 Export Plan]                        [Approve Plan →]      |               |
+---------------------------------------------------------------+---------------+
```

---

## Detailed Component Specifications

### A. WorkflowStepper (Top Navigation)

- Shows all 5 steps. Step 4 is active (highlighted, underlined).
- Clicking previous steps (1, 2, 3) is **disabled** once a plan is generated (you cannot go backwards without losing the plan).
- Clicking step 5 is disabled until the user explicitly clicks "Approve Plan" button.
- Right side of top bar: Date, Time, User avatar + name + division dropdown.

---

### B. Corridor Overview (Top-Left)

**Purpose**: Show the physical railway corridor with the maintenance plan overlaid. This is the "where" view.

**Data source**: Derived from `run.jobs[].section_id` and `run.schedule_items`.

**Default view** (from Excalidraw wireframe):
- A horizontal linear representation of the corridor with station nodes (BRC, VDA, AKW, BHU, SUR).
- Sections between nodes are color-coded by status:
  - **Green**: Clear (no active blocks)
  - **Amber**: Caution (some constraints)
  - **Red/Orange**: Restricted (active maintenance block)
- The integrated block section is highlighted with a distinct overlay.
- Clicking a section highlights all jobs in that section.
- The currently selected job's section pulses or is visually distinct.
- A small tooltip on hover shows section stats.

**Section info cards** (below the map):
Show 4 columns for each section:
```
BRC – VDA        VDA – AKW         AKW – BHU         BHU – SUR
Km 0 – 52        Km 52 – 146       Km 146 – 198       Km 198 – 256
Clear            Caution           Restricted          Clear
Tracks: 2/2      Tracks: 1/2       Tracks: 0/2         Tracks: 2/2
Constraints: 0   Constraints: 3    Constraints: 5       Constraints: 1
Works: 4         Works: 8          Works: 7             Works: 7
```

**Required data**:
```typescript
// Derive from RunDetail
sections: run.jobs.map(job => job.section_id) // unique sections
jobsBySection: Map<sectionId, Job[]>
scheduleByJob: Map<jobId, ScheduleItem>

// Section status rules:
// "Clear" = no scheduled jobs in this section
// "Caution" = 1-3 scheduled jobs
// "Restricted" = 4+ jobs OR any locked jobs
```

**Expanded Map view** (accessed via `[View on Map]` button):
- Opens a full-width modal or drawer
- Shows a more detailed corridor representation with geographic context if available
- May show actual km markers on the track line

**When the selected job changes** (via Gantt or Inspector):
- The section containing that job is highlighted on the corridor map
- If the selected job's section is in the "Restricted" zone, it pulses

---

### C. Weekly Timeline Summary (Bottom-Left)

**Purpose**: Show the temporal view of the maintenance plan. This is the "when" view.

**Default state** (condensed):
- Shows section rows × day columns in a compact Gantt format.
- The date range header shows the planning week: "18 Aug – 24 Aug 2026"
- Maintenance bars are colored by type (Integrated Block = purple, Other Trains = grey, Selected Work = blue/teal)
- The currently selected job's bar is highlighted with a border.
- Clicking a bar selects the job and opens the Inspector.

**Required data**:
```typescript
// From RunDetail
run.schedule_items    // provides start, end, job_id
run.jobs              // provides section_id, department
run.changes           // provides "CHANGED" | "PRESERVED" | "SCHEDULED" | "REJECTED"
```

**Bar styling rules**:
- Locked jobs: Show padlock icon on the bar
- Changed jobs (`changes[id] === "CHANGED"`): Slightly brighter or animated to indicate movement after replan
- Rejected jobs: Do not appear in the Gantt (shown only in the Job Explorer left panel)

**`[Expand Timeline ↗]` button**:
Opens the expanded timeline experience. Recommended: **Full-page overlay** (not a modal) that covers the entire screen content but preserves the top navigation bar.

The expanded timeline shows:
- Larger bars with job ID text visible inside
- More time resolution (hours instead of days)
- Drag-to-scroll week navigation
- A filter panel for department, status, section
- Close button `[✕ Collapse]` to return to the condensed view

**Task Summary row** (below timeline):
```
[26 Total Tasks]  [1 Integrated Block]  [9 Selected Work]  [16 Other Work]
```
These should be **clickable filters** — clicking "Integrated Block" highlights only integrated block jobs in the Gantt.

---

### D. Plan Impact Panel (Bottom-Center)

**Purpose**: Show the key quantitative improvement metrics. This is where the "business case" is visible.

**Data source**: `run.kpis` from `RunDetail`.

**Displayed fields**:
| Label | Field | Format |
|-------|-------|--------|
| Closure Time | `(baseline_closure_minutes - optimized_closure_minutes) / baseline_closure_minutes * 100` | "-36%" (red number = reduction = good) |
| Total Possessions | `(baseline_asset_downtime_minutes - optimized_asset_downtime_minutes) / baseline_asset_downtime_minutes * 100` | "-60%" |
| Plan Quality | `run.state` mapped to label | "Optimal" (green) or "Feasible" (amber) |

> **Important**: The backend computes `downtime_reduction_percent` directly. Use it. Do not re-derive it on the frontend.

**`[View Detailed Comparison]` button**:
Opens a slide-out drawer or modal with a before/after table showing baseline vs. optimized values for each KPI field:
```
                    Baseline     Optimized    Improvement
Closure Time (min)  390          250          -36%
Asset Downtime (min) 390         160          -59%
Maintenance Done    —            270 min      —
Rejected Work       —            120 min      —
```

---

### E. Job Inspector (Right Panel)

**Purpose**: Show detailed information about the currently selected maintenance job.

**Trigger**: Appears/updates when `selectedJobId` changes.

**Data sources**:
- `run.jobs.find(j => j.job_id === selectedJobId)` → `JobContext`
- `run.schedule_items.find(s => s.job_id === selectedJobId)` → `ScheduleItem`
- `run.ai_estimates.find(e => e.job_id === selectedJobId)` → `AiEstimate`
- `run.unscheduled_jobs.find(u => u.job_id === selectedJobId)` → unscheduled reason codes

**Header**:
```
Job Inspector                           < 2 of 26 >
                               ← prev         next →
```
The navigation arrows allow stepping through all jobs without closing the Inspector.

**Job details card**:
```
JOB-042  (Track Maintenance)         [High Priority]

Department    Engineering (TMS)
Section       ST-03 (AKW – BHU)
Location      Km 512/8 – 518/4        ← from asset_id, ASSUMPTION
Duration      120 min
Preferred Window  Fri 22:00 – Sat 00:00
Status        SCHEDULED               ← from schedule_item.status
Reason        Rail fracture detected  ← from job.work_type / notes
```

> **ASSUMPTION**: "Location" (km range) is not currently in the `JobContext` response. Only `asset_id` and `section_id` are available. A separate enrichment step or backend field may be needed. See [16-open-questions.md](./16-open-questions.md).

**"WHY THIS TIME?" section**:
Shows `schedule_item.reason_codes` as a human-readable list.

Reason code → Human label mapping:
```
PRIORITY_FIT           → "Window available"
TRAIN_PATH_FIT         → "Compatible with signal work"
LOCK_PRESERVED         → "Locked by planner"
RESOURCE_AVAILABLE     → "Resources available"
SHARED_POSSESSION      → "Shared possession opportunity"
ISOLATION_SATISFIED    → "Safety isolation satisfied"
AI_PRIORITY_HIGH       → "AI-assessed high priority"
```

If the job is unscheduled, show its rejection reason codes:
```
NO_ELIGIBLE_WINDOW → "No available maintenance window"
RESOURCE_CONFLICT  → "Required resources not available"
TRAIN_PATH_CONFLICT → "Conflicts with train path"
```

---

### F. Actions Panel (Right Panel — Job-Specific)

**CRITICAL SEPARATION**: These actions affect **only the selected job**. They are NOT global plan actions.

```
ACTIONS

[ 🔒 Lock in Schedule ]    [ 🕒 Change Window ]
  Keep this job as-is        Manually move this job

[ 🗑️ Exclude from Plan ]   [ 🔀 Find Alternative ]
  Remove this job            AI suggests next-best slot
```

**Lock in Schedule**:
- Enabled when: job is scheduled, not already locked, no other action in flight
- Disabled when: job is unscheduled (rejected), already locked, plan is approved
- On click: `POST /planning-runs/{run_id}/lock` → success → isDirty = true, job shows lock icon
- After success: Button changes to "🔒 Locked" and becomes disabled

**Change Window** (`NOT YET IMPLEMENTED`):
- Would open a modal with available windows for this section
- User selects new window → triggers lock with that window override
- Currently: Show as disabled with tooltip "Coming soon"

**Find Alternative** (`NOT YET IMPLEMENTED`):
- Would call a backend endpoint to find the next-best slot for this specific job only
- The existing `/replan` endpoint is a global re-optimization, not a per-job alternative finder
- Currently: Show as disabled with tooltip "Coming soon"

**Exclude from Plan** (`NOT YET IMPLEMENTED`):
- Would remove the job from the current plan (without deleting it from the dataset)
- Requires a confirmation dialog: "Exclude JOB-042 from this plan? It will appear in unscheduled jobs."
- Currently: Show as disabled with tooltip "Coming soon"

---

### G. Global Plan Status / Re-Optimize Panel (Right Panel — Global)

**CRITICAL**: This is separate from job-specific actions. It affects the entire plan.

**State: PLAN_UP_TO_DATE** (no dirty constraints):
```
PLAN STATUS
Plan is up to date.
No re-optimization needed.
```

**State: UNSAVED_CONSTRAINTS** (after locking a job):
```
GLOBAL ACTION

⚠️ Unsaved Constraints
You have locked 2 job(s). The plan
must be recalculated before approval.

[ 🔄 Re-Optimize Plan  › ]
```
The Re-Optimize button should have high visual prominence (full-width, prominent color).

**State: REOPTIMIZING** (after clicking Re-Optimize):
```
GLOBAL ACTION

⚙️ Re-Optimizing...
Preserving 2 locked job(s).
Recalculating unlocked work...

[██████░░░░░░░░░] Running...
```
- Gantt chart blurs with shimmer (except locked jobs which remain solid)
- Re-Optimize button disabled
- Approve button disabled

**State: REOPTIMIZE_FAILED**:
```
GLOBAL ACTION

❌ Re-Optimization Failed
The locked constraints could not be
satisfied. Check conflicting locks.

[ 🔄 Retry Re-Optimize ]
[ ↩ Undo Last Lock ]      ← NOT YET IMPLEMENTED
```

---

### H. Bottom Global Actions

Fixed at the bottom of the screen (or bottom of the right panel).

```
[ 📥 Export Plan ]                    [ Approve Plan → ]
```

**Export Plan**:
- Enabled ONLY when `run.export_ready === true`
- `export_ready` is `true` only after approval + validator passed + feasible state
- Before approval: Show as disabled with tooltip "Approve the plan first to unlock export"
- After approval: Enabled and calls `GET /{run_id}/export`

**Approve Plan →**:
- Enabled ONLY when:
  - `run.state === "FEASIBLE" || run.state === "OPTIMAL"`
  - `run.validator.passed === true`
  - `run.approval === null` (not already approved)
  - `isDirty === false` (no unsaved constraints)
- When `isDirty === true`: Show disabled with tooltip "Re-optimize the plan before approving"
- After approval: This button disappears entirely. Export/Print/Share appear instead.

---

## Interaction Synchronization

When the user selects a job (via Gantt, Map, or Explorer), all three components must synchronize:

```
User clicks JOB-042 bar in Gantt
    ↓
selectedJobId = "JOB-042" (shared state)
    ↓
Gantt: Highlight JOB-042 bar with border
Corridor Map: Highlight section AKW–BHU
Job Inspector: Update to show JOB-042 details
Job Explorer (if visible): Scroll to and highlight JOB-042
```

Implement by passing `selectedJobId` and `onJobSelect(jobId)` as props to all three components, or share via React Context.

---

## Read-Only Mode (Approved Plan)

When `run.approval !== null` (plan is approved), the Review Plan screen enters Read-Only Mode:

- All job action buttons (Lock, Change Window, Exclude, Find Alternative) are disabled
- Re-Optimize button is hidden
- Approve Plan button is hidden
- Export Plan button is enabled and prominent
- Print Plan and Share with Teams options appear
- A banner at the top shows: "✅ This plan was approved by [reviewer] on [date]. It is now locked for editing."
