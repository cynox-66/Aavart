# 09 — Data Models

All frontend-facing data shapes. These are derived directly from the backend contract files at:
- `backend/src/railniyojan/contracts/models.py`
- `backend/src/railniyojan/contracts/api.py`
- `backend/src/railniyojan/contracts/enums.py`
- `apps/web/src/lib/api.ts` (TypeScript mirror)

Do not invent new fields on the frontend. Use only what the API returns.

---

## Core Domain Models

### Section
A segment of the railway corridor.

```typescript
interface Section {
  section_id: string;        // e.g., "ST-01", "SEC-A"
  from_node: string;         // e.g., "BRC"
  to_node: string;           // e.g., "VDA"
  line: string;              // e.g., "Western"
  direction: "UP" | "DOWN" | "BOTH";
}
```

### Asset
A physical railway asset within a section.

```typescript
interface Asset {
  asset_id: string;          // e.g., "ASSET-001"
  asset_type: string;        // e.g., "TRACK", "SIGNAL", "OHE"
  section_id: string;        // Which section it belongs to
  status: "AVAILABLE" | "RESTRICTED" | "UNAVAILABLE";
}
```

### PlanningWindow
A time slot when maintenance is allowed on a section.

```typescript
interface PlanningWindow {
  window_id: string;         // e.g., "WIN-001"
  start: string;             // ISO 8601 datetime with timezone
  end: string;               // ISO 8601 datetime with timezone
  section_id: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
}
```

### Job
A single maintenance task. This is both an input (in the dataset) and referenced in the plan output.

```typescript
interface Job {
  job_id: string;            // e.g., "JOB-001", "TMS-042"
  department: "TRACK" | "SIGNAL" | "ELECTRICAL" | "CIVIL";
  asset_id: string;
  section_id: string;
  work_type: string;         // e.g., "Track Maintenance", "Rail Inspection"
  priority: number;          // 0-100 (100 = highest priority)
  duration_minutes: number;
  duration_min_minutes: number;
  duration_max_minutes: number;
  required_resources: string[];  // resource_id[]
  allowed_windows: string[];     // window_id[]
  status: "UNSCHEDULED" | "SCHEDULED" | "LOCKED" | "REJECTED" | "INVALID";
}
```

> **Note**: The full `Job` model is only sent to the backend (for RapidBlock). The frontend receives `JobContext` from planning run responses, which is a subset.

---

## API Response Models

### JobContext
A lightweight job representation returned in planning run responses.

```typescript
interface JobContext {
  job_id: string;
  department: string;        // "TRACK" | "SIGNAL" | "ELECTRICAL" | "CIVIL"
  asset_id: string;
  section_id: string;
  work_type: string;
  priority: number;          // 0-100
}
```

> **Missing fields** vs full `Job`: `duration_minutes`, `allowed_windows`, `required_resources`, `status` are NOT in `JobContext`. If the Inspector needs to show duration or preferred window, it must get it from `ScheduleItem.start/end` (actual scheduled time, not preferred).

### ScheduleItem
A single job's placement in the schedule.

```typescript
interface ScheduleItem {
  job_id: string;
  window_id: string;         // Which planning window it was placed in
  start: string;             // ISO 8601 — actual scheduled start
  end: string;               // ISO 8601 — actual scheduled end
  status: "SCHEDULED" | "LOCKED" | "REJECTED";
  reason_codes: string[];    // Why scheduled here or why rejected
  locked: boolean;           // true if planner locked this item
}
```

### ValidationResponse
Result of `POST /datasets/validate`.

```typescript
interface ValidationResponse {
  valid: boolean;
  snapshot_candidate_id: string | null;  // Available only when valid = true
  errors: ValidationIssue[];
  counts: {
    jobs: number;
    windows: number;
    assets: number;
    sections: number;
    resources: number;
  };
}

interface ValidationIssue {
  code: string;              // e.g., "MISSING_FIELD", "INVALID_REFERENCE"
  message: string;
  field: string;             // Which field has the issue
  row: number | null;        // Which CSV row (null for JSON validation)
  details?: Record<string, unknown>;
}
```

### RunDetail
Full planning run details. The primary data shape for the Review Plan screen.

```typescript
interface RunDetail {
  run_id: string;
  state: PlanningRunState;
  snapshot_id: string;
  snapshot_status: string;
  ruleset_version: string;
  created_at: string;                    // ISO 8601
  completed_at: string | null;
  parent_run_id: string | null;          // Set if this was a replan
  schedule_items: ScheduleItem[];
  unscheduled_jobs: Array<{
    job_id: string;
    reason_codes: string[];
  }>;
  jobs: JobContext[];                    // All jobs in the snapshot
  validator: ValidatorSummary;
  approval: ApprovalSummary | null;      // null until approved
  changes: Record<string, ChangeStatus>; // Per-job change tracking
  export_ready: boolean;                 // Computed by backend
  kpis: KpiSummary;
  ai_estimates: AiEstimate[];
}

type PlanningRunState = "QUEUED" | "RUNNING" | "FEASIBLE" | "OPTIMAL" | "INFEASIBLE" | "TIMEOUT" | "INVALID" | "FAILED";
type ChangeStatus = "SCHEDULED" | "REJECTED" | "PRESERVED" | "CHANGED";
```

### KpiSummary
Key performance indicators. Always render from backend — do not recalculate.

```typescript
interface KpiSummary {
  baseline_closure_minutes: number;          // What closure would have been without optimization
  optimized_closure_minutes: number;         // Actual optimized closure time
  scheduled_maintenance_minutes: number;     // Total maintenance work scheduled
  rejected_maintenance_minutes: number;      // Total work that couldn't be scheduled
  baseline_asset_downtime_minutes: number;   // Pre-optimization asset downtime
  optimized_asset_downtime_minutes: number;  // Post-optimization asset downtime
  downtime_reduction_minutes: number;        // Absolute reduction in minutes
  downtime_reduction_percent: number;        // Percentage reduction (display as "XX%")
}
```

**Display mapping**:
- "Closure Time" metric → `((baseline - optimized) / baseline) * 100` → backend provides this as `downtime_reduction_percent`
- "Plan Quality" → derived from `run.state`: OPTIMAL → "Optimal", FEASIBLE → "Feasible", others → "Degraded"

### ApprovalSummary
Set when the plan has been approved.

```typescript
interface ApprovalSummary {
  reviewer: string;        // Who approved
  comment: string;         // Approval remarks
  approved_at: string;     // ISO 8601 timestamp
  run_id: string;
  snapshot_id: string;
  ruleset_version: string;
}
```

### ValidatorSummary
Independent safety validation result.

```typescript
interface ValidatorSummary {
  passed: boolean;
  issues: Record<string, unknown>[];  // Validator issues if any
  validated_at: string;               // ISO 8601
}
```

### AiEstimate
AI-assisted priority/duration estimate for a job.

```typescript
interface AiEstimate {
  job_id: string;
  source: "LOCAL_HEURISTIC" | "DETERMINISTIC_FALLBACK";
  priority: number;
  duration_minutes: number;
  duration_min_minutes: number;
  duration_max_minutes: number;
  reason_codes: string[];
}
```

**Display note**: Do not label this as "AI prediction" or "machine learning" in the UI. It is a local heuristic estimate. Label it as "AI-Assisted Estimate" with a ⚠️ note that this is a deterministic local model.

---

## RapidBlock Models

### RapidBlockResponse
Initial response from `POST /rapidblock-requests`.

```typescript
interface RapidBlockResponse {
  request_id: string;
  state: RapidBlockState;
  base_run_id: string;
  base_snapshot_id: string;
  derived_snapshot_id: string | null;  // Available after optimization
  child_run_id: string | null;          // Available after optimization
  reason_codes: string[];
  status_url: string;                   // GET URL for detail
}

type RapidBlockState = "SUBMITTED" | "VALIDATING" | "REJECTED" | "PLANNING" | "CANDIDATE_READY" | "NO_CANDIDATE";
```

### RapidBlockDetail
Full detail from `GET /rapidblock-requests/{request_id}`.

```typescript
interface RapidBlockDetail extends RapidBlockResponse {
  actor: string;
  actor_role: "PLANNER";
  justification: string;
  source_reported_at: string;
  urgent_job: Job;
  changed_jobs: Record<string, ChangeStatus>;   // Which existing jobs were moved
  preserved_locked_jobs: string[];              // job_ids that were locked and kept
  validator: ValidatorSummary | null;
  candidate_plan_status: PlanningRunState | null;
}
```

**Cascade impact computation** (frontend-side):
```typescript
const rescheduledCount = Object.values(detail.changed_jobs)
  .filter(status => status === "CHANGED" || status === "REJECTED").length;
const preservedCount = detail.preserved_locked_jobs.length;
```

---

## Enums Reference

```typescript
// Job status in the input dataset
type JobStatus = "UNSCHEDULED" | "SCHEDULED" | "LOCKED" | "REJECTED" | "INVALID";

// Schedule item status in the output
type ScheduleStatus = "SCHEDULED" | "LOCKED" | "REJECTED";

// Planning run state
type PlanningRunState = "QUEUED" | "RUNNING" | "FEASIBLE" | "OPTIMAL" | "INFEASIBLE" | "TIMEOUT" | "INVALID" | "FAILED";

// RapidBlock request state
type RapidBlockState = "SUBMITTED" | "VALIDATING" | "REJECTED" | "PLANNING" | "CANDIDATE_READY" | "NO_CANDIDATE";

// Window availability
type Availability = "AVAILABLE" | "UNAVAILABLE";

// Asset status
type AssetStatus = "AVAILABLE" | "RESTRICTED" | "UNAVAILABLE";
```

---

## Reason Code Reference

These codes appear in `schedule_item.reason_codes` and `ai_estimate.reason_codes`.

| Code | Appears When | Human-Readable Label |
|------|-------------|---------------------|
| `LOCK_PRESERVED` | Item was locked, preserved in replan | "Locked by planner" |
| `PRIORITY_FIT` | High priority job got a preferred window | "Window available" |
| `TRAIN_PATH_FIT` | Scheduled without conflicting with trains | "Compatible with train schedule" |
| `SHARED_POSSESSION` | Multiple dept jobs share one possession | "Shared possession opportunity" |
| `ISOLATION_SATISFIED` | Safety isolation requirements met | "Safety isolation satisfied" |
| `RESOURCE_AVAILABLE` | Required crew/equipment available | "Resources available" |
| `AI_PRIORITY_HIGH` | AI estimate flagged as high priority | "AI-assessed high priority" |
| `RAPIDBLOCK_CANDIDATE` | Emergency block successfully planned | "Emergency candidate ready" |
| `NO_ELIGIBLE_WINDOW` | No window available for scheduling | "No available maintenance window" |
| `TRAIN_PATH_CONFLICT` | Conflicts with a train path | "Conflicts with train path" |
| `RESOURCE_CONFLICT` | Required resources unavailable | "Required resources not available" |
| `SECTION_CONFLICT` | Another job on same section at same time | "Section already occupied" |
| `ISOLATION_CONFLICT` | Safety isolation cannot be achieved | "Safety isolation conflict" |
| `OUTSIDE_PLANNING_SCOPE` | Job or window outside snapshot boundaries | "Outside planning scope" |
