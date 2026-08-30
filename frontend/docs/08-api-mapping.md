# 08 — API Mapping

This is the complete mapping from every UI action to its backend endpoint, including request bodies, response shapes, and frontend state changes.

All endpoints are relative to `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`).

The existing API client is at `apps/web/src/lib/api.ts`. Do not bypass it.

---

## API Mapping Table

### 1. Validate Dataset

| Field | Value |
|-------|-------|
| **UI Screen** | Step 2: Check Data |
| **UI Trigger** | Fires automatically on screen entry after user selects files in Step 1 |
| **Endpoint** | `POST /datasets/validate` |
| **Content-Type** | `text/csv` (for CSV files) or `application/json` |
| **Request Body** | Raw CSV text or the full dataset JSON payload |
| **Success Response** | `ValidationResponse` — see below |
| **Frontend State Changed** | `validationState` → `valid` or `invalid` |
| **Loading Behaviour** | Show "Validating your data..." spinner. Disable Continue button. |
| **Success Behaviour** | Store `snapshot_candidate_id`. Show validation summary. Enable Continue if `valid === true`. |
| **Failure Behaviour (network)** | Show "Unable to reach server. Retry?" |
| **Failure Behaviour (400)** | Show specific `ValidationIssue[]` in Needs Attention panel |

```typescript
// Success response shape
interface ValidationResponse {
  valid: boolean;
  snapshot_candidate_id: string | null; // Store this for Step 3
  errors: ValidationIssue[];
  counts: { jobs: number; windows: number; assets: number; sections: number; resources: number };
}

interface ValidationIssue {
  code: string;    // e.g., "MISSING_FIELD", "INVALID_REFERENCE"
  message: string;
  field: string;
  row: number | null;
}
```

---

### 2. Create Planning Run

| Field | Value |
|-------|-------|
| **UI Screen** | Step 3: Create Plan |
| **UI Trigger** | Fires automatically on screen entry |
| **Endpoint** | `POST /planning-runs` |
| **Request Body** | `{ snapshot_id: string, ruleset_version: "Demo Ruleset v1" }` |
| **Success Response** | `PlanningRunCreatedResponse` → then auto-fetches `GET /planning-runs/{run_id}` |
| **Frontend State Changed** | `activeRunId` set to new `run_id` |
| **Loading Behaviour** | Progress checklist animation. Continue button disabled. |
| **Success Behaviour** | Auto-advance to Step 4: Review Plan with `run_id` |
| **Failure (409 STALE_SNAPSHOT)** | "Dataset has expired. Go back and re-upload." with `[Back]` button |
| **Failure (INFEASIBLE)** | "No valid schedule found." Offer retry or go back |
| **Failure (TIMEOUT)** | "Optimizer timed out." Offer continue with partial or go back |

```typescript
// Request
{ snapshot_id: "SNAP-ABC123", ruleset_version: "Demo Ruleset v1" }

// Initial response (from POST /planning-runs)
{ run_id: "RUN-001", state: "FEASIBLE", snapshot_id: "...", ... }

// Full detail (from GET /planning-runs/RUN-001)
// → RunDetail (see 09-data-models.md)
```

---

### 3. Get Planning Run

| Field | Value |
|-------|-------|
| **UI Screen** | Step 4: Review Plan (loads on entry and after lock/replan) |
| **UI Trigger** | On screen entry, after lock, after replan, after approve |
| **Endpoint** | `GET /planning-runs/{run_id}` |
| **Request Body** | None |
| **Success Response** | `RunDetail` |
| **Frontend State Changed** | `activeRun` updated with full plan data |
| **Loading Behaviour** | Full-page skeleton while initial load. Inline spinner for subsequent refreshes. |
| **Success Behaviour** | Render Gantt, Corridor Map, KPIs, Job Inspector |
| **Failure (404)** | "Plan not found. It may have been deleted." Navigate to Home. |

---

### 4. Lock a Job

| Field | Value |
|-------|-------|
| **UI Screen** | Step 4: Review Plan — Job Inspector |
| **UI Trigger** | User clicks `[🔒 Lock in Schedule]` in the Actions panel |
| **Endpoint** | `POST /planning-runs/{run_id}/lock` |
| **Request Body** | `{ job_id: string, reason: string }` |
| **Success Response** | `LockResponse` → then auto-fetches `GET /planning-runs/{run_id}` |
| **Frontend State Changed** | `isDirty = true`, `lockedJobsCount++`, run refreshed |
| **Loading Behaviour** | Lock button disabled with "Locking..." text |
| **Success Behaviour** | Job shows lock icon in Gantt. Global Re-Optimize panel activates. Toast: "JOB-042 has been locked." |
| **Failure (409 INVALID_RUN_STATE)** | Toast error: "Only scheduled jobs can be locked." |
| **Failure (404 SCHEDULE_ITEM_NOT_FOUND)** | Toast error: "This job is not in the current schedule." |

```typescript
// Request
{ job_id: "JOB-042", reason: "Planner accepted this block" }

// Response
{ run_id: "RUN-001", job_id: "JOB-042", locked: true, reason_codes: ["LOCK_PRESERVED"] }
```

**Guard condition**: Button is only enabled when:
- `schedule !== undefined` (job is scheduled)
- `schedule.locked === false` (not already locked)
- `schedule.status === "SCHEDULED"` (not rejected)
- `busy === null` (no other action in flight)

---

### 5. Re-Optimize Plan (Replan)

| Field | Value |
|-------|-------|
| **UI Screen** | Step 4: Review Plan — Global Plan Status panel |
| **UI Trigger** | User clicks `[🔄 Re-Optimize Plan]` |
| **Endpoint** | `POST /planning-runs/{run_id}/replan` |
| **Request Body** | `{ affected_section_ids: string[], affected_window_ids: string[] }` |
| **Success Response** | `PlanningRunCreatedResponse` with new `run_id` → then `GET /planning-runs/{new_run_id}` |
| **Frontend State Changed** | `activeRunId` = new run_id, `isDirty = false`, `activeRun` = new run detail |
| **Loading Behaviour** | Blur/shimmer over Gantt and Map. Locked jobs remain solid. Re-Optimize button shows "Optimizing..." |
| **Success Behaviour** | Gantt/Map animate to new schedule. Toast: "✅ Re-optimization complete. N jobs were shifted." KPI numbers flash. |
| **Failure (INFEASIBLE)** | Preserve current plan. Show error banner: "⚠️ Plan Infeasible. The constraints you locked conflict with each other. Reverting to previous plan." Highlight conflicting locked jobs in red. |
| **Failure (409 STALE_SNAPSHOT)** | "Dataset is stale. Please start a new plan." |
| **Failure (400 OUTSIDE_PLANNING_SCOPE)** | "Re-plan scope is outside the current snapshot boundaries." |

```typescript
// Request (affected_section_ids: sections where locked/changed jobs live)
{
  affected_section_ids: ["SEC-A", "SEC-B"],
  affected_window_ids: ["WIN-001", "WIN-002"]
}

// Response (this is a NEW run, not the same run_id)
{ run_id: "RUN-002", state: "OPTIMAL", snapshot_id: "SNAP-ABC123", ... }
```

**Important**: The replan response contains a **new `run_id`**. The frontend must:
1. Store the new `run_id` as the active run
2. Fetch `GET /planning-runs/{new_run_id}` to get full details
3. Update all components to use the new run data

---

### 6. Approve Plan

| Field | Value |
|-------|-------|
| **UI Screen** | Step 5: Approve Plan |
| **UI Trigger** | User clicks `[✍️ Digitally Sign & Approve]` |
| **Endpoint** | `POST /planning-runs/{run_id}/approve` |
| **Request Body** | `{ reviewer: string, comment: string }` |
| **Success Response** | `ApprovalResponse` → then `GET /planning-runs/{run_id}` to refresh |
| **Frontend State Changed** | `activeRun.approval` populated, navigate to Plan Approved screen |
| **Loading Behaviour** | Button disabled with "Approving..." |
| **Success Behaviour** | Navigate to Plan Approved screen. Export/Share/Print become available. |
| **Failure (409 ALREADY_APPROVED)** | Refetch run and redirect to Approved screen (stale state). |
| **Failure (409 SAFETY_VALIDATION_FAILED)** | "Safety validation did not pass. Cannot approve." with `[Start New Plan]` button. |
| **Failure (409 INVALID_RUN_STATE)** | "Only a feasible, validated plan can be approved." |

```typescript
// Request
{ reviewer: "Arnav Pathak", comment: "Reviewed schedule and validator results. Approved for dispatch." }

// Response
{
  run_id: "RUN-001",
  approved: true,
  approval: {
    reviewer: "Arnav Pathak",
    comment: "...",
    approved_at: "2026-08-30T06:30:00Z",
    run_id: "RUN-001",
    snapshot_id: "SNAP-ABC123",
    ruleset_version: "Demo Ruleset v1"
  }
}
```

---

### 7. Export Plan

| Field | Value |
|-------|-------|
| **UI Screen** | Plan Approved screen |
| **UI Trigger** | User clicks `[📥 Export Plan]` |
| **Endpoint** | `GET /planning-runs/{run_id}/export` |
| **Request Body** | None |
| **Success Response** | CSV file blob (Content-Disposition: attachment) |
| **Frontend State Changed** | None (file downloads automatically) |
| **Loading Behaviour** | Export button disabled with "Downloading..." |
| **Success Behaviour** | Browser downloads `{run_id}.csv` automatically. |
| **Failure (409 EXPORT_BLOCKED)** | Toast: "Export blocked. Plan must be approved, validated, and feasible." |
| **Failure (404)** | Toast: "Plan not found." |

---

### 8. Create RapidBlock Request

| Field | Value |
|-------|-------|
| **UI Screen** | Emergency Rapid-Block Mode |
| **UI Trigger** | User clicks `[⚡ Inject & Re-Optimize]` |
| **Endpoint** | `POST /rapidblock-requests` |
| **Request Body** | Full `RapidBlockRequestPayload` (see below) |
| **Success Response** | `RapidBlockResponse` with `state` and optional `child_run_id` |
| **Frontend State Changed** | `rapidBlockState` transitions based on response `state` |
| **Loading Behaviour** | Form disabled, "Calculating impact..." spinner on right panel |
| **Success (CANDIDATE_READY)** | Show cascade impact, Corridor Map highlights, Approve button enables |
| **Failure (REJECTED: UNAUTHORISED_ACTOR)** | "You are not authorized to submit emergency requests." |
| **Failure (REJECTED: NO_ELIGIBLE_WINDOW)** | "No available maintenance window exists for this job." |
| **Failure (REJECTED: LOCK_CONFLICT)** | "The emergency job conflicts with a locked schedule item." |
| **Response (NO_CANDIDATE)** | "No feasible schedule found. The optimizer could not fit this emergency job." |

```typescript
// Request
{
  base_run_id: "RUN-001",
  actor: "officer-01",          // Must be in planner allowlist
  actor_role: "PLANNER",
  justification: "Rail fracture at km 512. Immediate inspection required.",
  source_reported_at: "2026-08-30T05:00:00+05:30",
  urgent_job: {
    job_id: "JOB-EMG-001",
    department: "TRACK",
    asset_id: "ASSET-001",
    section_id: "SEC-A",
    work_type: "urgent rail inspection",
    priority: 100,
    duration_minutes: 240,
    duration_min_minutes: 240,
    duration_max_minutes: 300,
    required_resources: ["TRACK_TEAM_1"],
    allowed_windows: ["WIN-002"],
    status: "UNSCHEDULED"
  }
}

// Response states
// "CANDIDATE_READY" → child_run_id available, show impact
// "NO_CANDIDATE" → no slot found, show reason_codes
// "REJECTED" → rejected with reason_codes
```

**OPEN QUESTION**: The frontend must know available `asset_id`, `section_id`, and `allowed_windows` to build the emergency job payload. These come from the base snapshot's dataset. The frontend must load the base snapshot data to populate the form dropdowns. There is no dedicated "get snapshot entities" endpoint. See [16-open-questions.md](./16-open-questions.md).

---

### 9. Get RapidBlock Request Details

| Field | Value |
|-------|-------|
| **UI Screen** | Emergency Rapid-Block Mode (after submit) |
| **UI Trigger** | Called after `POST /rapidblock-requests` returns `child_run_id` |
| **Endpoint** | `GET /rapidblock-requests/{request_id}` |
| **Success Response** | `RapidBlockDetail` with `changed_jobs`, `preserved_locked_jobs`, cascade data |
| **Frontend State Changed** | Populate cascade impact panel with changed jobs count |

---

## Endpoints Not Yet Used by the Frontend

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /health` | IMPLEMENTED | Used by `health-check.tsx` for backend connectivity |
| `GET /planning-runs` (list) | NOT IMPLEMENTED | No list endpoint exists. See open questions. |
| `POST /planning-runs/{id}/lock` with unlock | NOT IMPLEMENTED | Once locked, a job cannot be unlocked via API |
| `DELETE /planning-runs/{id}` | NOT IMPLEMENTED | No delete endpoint |
| Print Plan | NOT IMPLEMENTED | Would use `window.print()` |
| Share with Teams | NOT IMPLEMENTED | No sharing endpoint |
