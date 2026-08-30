# 11 — Rapid Blocking (Emergency Workflow)

The Emergency Rapid-Block Mode is a **separate operational workflow** that is completely independent from the normal 5-step planning wizard. It allows an authorized planner to inject an urgent maintenance job into the currently active plan in response to a live incident.

---

## When to Use This Workflow

A rail fracture is detected at km 512 of section AKW–BHU. The track maintenance team must immediately close that section for inspection and repair. The existing weekly plan did not include this job. The Emergency Rapid-Block Mode allows the operator to:

1. Inject this urgent job as a hard constraint
2. Have the CP-SAT optimizer automatically reschedule all other affected work around it
3. See exactly which jobs were displaced and which trains will be delayed
4. Approve and dispatch the emergency plan immediately

---

## Access Point

The Emergency Rapid-Block Mode is accessed via the **Home screen** "Emergency Block Planning" button. It does NOT go through the 5-step wizard.

---

## Page Layout

```text
+------------------------------------------------------------------+
| RailNiyojan                          [AR] Divisional Manager ↓   |
+------------------------------------------------------------------+
| [⚠️] EMERGENCY RAPID-BLOCK MODE           [← Exit to Home]       |
|      Current Target → SNAP-014                                    |
+------------------------------------------------------------------+
|                                   |                               |
|  INCIDENT DETAILS                 |  LIVE MAP & BLAST RADIUS      |
|  --------------------------------  |  [Emergency Impact Detected]  |
|  Incident Type:                   |                               |
|  [ Rail Fracture (TMS)       ▼ ] |  +---------------------------+ |
|                                   |  | BRC-VDA-AKW-[BHU]-SUR    | |
|  Section / Location:              |  |          📍 Rail Fracture  | |
|  [ ST-03 (AKW – BHU)        ▼ ] |  |     (Red circle: blast)   | |
|                                   |  +---------------------------+ |
|  Estimated Duration:              |                               |
|  [ 4 Hours                   ▼ ] |  CASCADE IMPACT (If Injected) |
|                                   |  +---------+ +---------+      |
|  Notes (Optional):                |  |    4    | |    2    |      |
|  [Rail snapped at km 512.      ] |  | Maint.  | | Trains  |      |
|                                   |  | Reschd. | | Delayed |      |
|                                   |  +---------+ +---------+      |
|  [⚙️ Inject & Re-Optimize]        |                               |
|                                   |  What happens next?           |
|                                   |  "Injecting will lock the    |
|                                   |   emergency block and        |
|                                   |   re-optimize entire plan."  |
|                                   |                               |
|                                   |  [⚡ Approve Emergency Dispatch] |
+------------------------------------------------------------------+
```

---

## Important UI Rules

1. **The 5-step progress bar is NOT shown** on this page. This is not a wizard step.
2. **The header shows `🔴 LIVE SYSTEM`** (or "Current Target → SNAP-014") to make clear this modifies a live plan.
3. The layout is a **two-panel split**: Incident Form (left) and Live Map + Impact (right).
4. The map on the right is always visible, even before the user submits. Initially it shows the full corridor in a neutral state.

---

## Incident Form Specification

### Incident Type (dropdown)

Available options (must match allowed `work_type` values in the backend dataset):
- Rail Fracture (TMS)
- Signal Equipment Failure (SMMS)
- OHE / Traction Failure (TDMS)
- Bridge Emergency (TMS)
- Flooding / Earthwork (TMS)
- Other Emergency

This field maps to: `urgent_job.work_type` and `urgent_job.department`.

### Section / Location (dropdown)

Populated from the available sections in the base run's snapshot. Example:
- ST-01 (BRC – VDA, Km 0–52)
- ST-02 (VDA – AKW, Km 52–146)
- ST-03 (AKW – BHU, Km 146–198)
- ST-04 (BHU – SUR, Km 198–256)

This field maps to: `urgent_job.section_id`.

> **OPEN QUESTION**: The frontend needs to know available sections, assets, resources, and windows from the base snapshot to correctly construct the `urgent_job` payload. There is no dedicated endpoint for this. The frontend must either (a) call `GET /planning-runs/{base_run_id}` which returns `jobs[]` with `section_id` and `asset_id`, or (b) have a `GET /datasets/{snapshot_id}` endpoint that returns the raw snapshot data. Option (b) does not currently exist. See [16-open-questions.md](./16-open-questions.md).

### Estimated Duration (dropdown or slider)

Options: 1 Hour, 2 Hours, 4 Hours, 6 Hours, 8 Hours, Custom (number input).

This field maps to: `urgent_job.duration_minutes`.

### Notes (textarea)

Free text. Maps to: `request.justification`.

---

## Live Map Panel

**Before submission**: Shows the full corridor in normal state (BRC → VDA → AKW → BHU → SUR, all green/normal).

**When section is selected**: The selected section is highlighted in amber.

**After CANDIDATE_READY response**: The affected section turns red with a pulsing "blast radius" circle. A tooltip at the incident point shows:
```
📍 Rail Fracture
   km 512
```

The cascade impact cards update:
```
+---------------+  +-------------------+
|      4        |  |         2         |
| Scheduled     |  | Commercial trains |
| maintenance   |  | will be delayed   |
| jobs will be  |  |                   |
| rescheduled   |  |                   |
+---------------+  +-------------------+
```

These numbers come from `rapidblock_detail.changed_jobs` (count of "CHANGED" jobs) and would require the backend to also return affected train counts. See [16-open-questions.md](./16-open-questions.md).

---

## The `[Inject & Re-Optimize]` Button

**Purpose**: Submits the emergency job to the backend.

**Enabled when**:
- Incident Type is selected
- Section is selected
- Duration is set
- No other action in flight (`busy === null`)

**On click**:
1. Validate the form (no empty required fields)
2. Construct the full `RapidBlockRequestPayload` from the form values
3. Call `POST /rapidblock-requests`
4. Disable the form while the request is in flight
5. Show "Calculating impact..." on the right panel with a spinner

**API call**:
```typescript
const payload: RapidBlockRequestPayload = {
  base_run_id: activeRunId,   // The currently active plan's run_id
  actor: currentUser.id,       // Must be in planner allowlist
  actor_role: "PLANNER",
  justification: notes,
  source_reported_at: new Date().toISOString(),
  urgent_job: {
    job_id: `JOB-EMG-${Date.now()}`,  // Generate unique ID
    department: incidentTypeToDepartment(incidentType),  // "TRACK" | "SIGNAL" | "ELECTRICAL"
    asset_id: selectedAssetId,   // From base snapshot
    section_id: selectedSectionId,
    work_type: incidentType,
    priority: 100,               // Emergency = highest priority
    duration_minutes: durationMinutes,
    duration_min_minutes: durationMinutes,
    duration_max_minutes: durationMinutes + 60,  // +1hr buffer
    required_resources: inferredResources,  // From base snapshot
    allowed_windows: availableWindows,      // From base snapshot
    status: "UNSCHEDULED"
  }
};
```

---

## Response Handling

### State: `CANDIDATE_READY`

The optimizer successfully fit the emergency job.

- Right panel updates with cascade impact
- Corridor map updates to show blast radius
- `[Approve Emergency Dispatch]` button becomes enabled
- A text box appears: "What happens next? Injecting will lock the emergency block and re-optimize the entire plan. All affected tasks and trains will be rescheduled automatically."

### State: `NO_CANDIDATE`

The optimizer could not fit the emergency job.

- Show on right panel: "⚠️ No Feasible Schedule Found"
- Show `reason_codes` in human-readable form:
  - `NO_ELIGIBLE_WINDOW` → "No available maintenance window exists for this section and duration."
  - `LOCK_CONFLICT` → "The emergency job conflicts with a currently locked schedule item."
- Allow user to modify the form and retry.

### State: `REJECTED`

The request was rejected before optimization even ran.

- `UNAUTHORISED_ACTOR` → "You are not authorized to submit emergency requests. Contact your administrator."
- `OUTSIDE_PLANNING_SCOPE` → "The specified section or asset is outside the current plan's scope."
- `NO_ELIGIBLE_WINDOW` → "No available window exists."
- Allow form modification and retry.

---

## The `[Approve Emergency Dispatch]` Button

**Available only after `CANDIDATE_READY`**.

**On click**:
1. Show confirmation dialog:
   > "You are about to approve an emergency dispatch for SNAP-014-EMG. This will override the existing schedule for section ST-03. 4 jobs will be rescheduled. Continue?"
   > `[Cancel]` `[Confirm Emergency Dispatch]`
2. If confirmed: Call `POST /planning-runs/{child_run_id}/approve` with:
   ```typescript
   { reviewer: currentUser.id, comment: `Emergency dispatch: ${justification}` }
   ```
3. Loading state: All buttons disabled, "Approving..." spinner
4. On success: Show success modal (overlay on current screen):

```
+------------------------------------------+
|                                          |
|  ✅  EMERGENCY DISPATCH SUCCESSFUL       |
|                                          |
|  The revised schedule (SNAP-014-EMG)     |
|  has been created and is ready for field |
|  operations.                             |
|                                          |
|  Changes: 4 jobs rescheduled             |
|           2 locked jobs preserved        |
|                                          |
|  [ Return to Home Dashboard ]            |
|                                          |
+------------------------------------------+
```

---

## Failure States

### Network failure during submit
Show inline error below the Inject button: "Unable to connect to the server. Check your connection and try again."

### Optimization failure after CANDIDATE_READY approval
If `POST /approve` fails for the child run:
- Show: "Emergency approval failed. The child plan could not be approved. Please try again or contact support."
- Keep `[Retry Approval]` button available.
- Do NOT navigate away — the user may need to retry.

### Lock conflict during emergency inject
If the response is `REJECTED: LOCK_CONFLICT`:
- Show: "The emergency job conflicts with a job that was manually locked in the current schedule."
- Offer: "You may unlock the conflicting job in the Review Plan before attempting this emergency block."
- `[← Return to Review Plan]` button.

---

## Audit Trail

All RapidBlock actions are automatically audited by the backend. The frontend does not need to do anything special. The audit records `actor`, `request_id`, `base_run_id`, `child_run_id`, and state transitions.

---

## What the Emergency Flow Does NOT Do

- It does not modify the original (parent) plan. The parent plan remains immutable.
- It does not bypass safety validation. The child run goes through the same independent validator.
- It does not grant operational railway authority. The output is a candidate recommendation.
- It does not connect to live BDMS, TMS, or SMMS systems.
