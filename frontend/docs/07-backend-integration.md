# 07 — Backend Integration

This document defines the boundary between what the frontend is responsible for and what the backend owns.

---

## Core Principle

> The backend is the single source of truth for all operational data. The frontend is a display, input collection, and state presentation layer. It must never invent, calculate, or override backend values.

---

## Frontend Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **State display** | Render `run.state`, `run.kpis`, `run.schedule_items`, `run.approval`, `run.export_ready` exactly as returned by the API |
| **User input collection** | Forms for dataset upload, approval sign-off, emergency incident details |
| **API call triggering** | Translating user actions (button clicks) into HTTP calls at the correct time |
| **Async operation UX** | Loading spinners, shimmer states, disabled buttons during in-flight requests |
| **Error presentation** | Translating backend error codes into human-readable messages |
| **State machine transitions** | Tracking UI-level state like `selectedJobId`, `isDirty`, `optimizationState` |
| **Navigation** | Moving between wizard steps, screens, and modes |
| **Client-side formatting** | Date/time formatting, percentage formatting, string truncation |
| **Job selection synchronization** | Keeping Gantt, Map, and Inspector in sync via shared `selectedJobId` |

---

## Backend Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Dataset validation** | Structural checks, reference integrity, required fields |
| **Snapshot management** | Creating, storing, and versioning immutable snapshots |
| **Optimization** | Running CP-SAT to produce a valid schedule |
| **Safety constraint enforcement** | Ensuring no schedule violates safety rules (spatial, temporal, resource conflicts) |
| **Independent validation** | Verifying the optimizer output with a separate validator |
| **KPI calculation** | Computing `downtime_reduction_percent`, `optimized_closure_minutes`, etc. |
| **Lock enforcement** | Preserving locked items during replan |
| **Approval gating** | Blocking approval for invalid, stale, or unsafe plans |
| **Export gating** | Blocking export for unapproved plans |
| **Audit trail** | Recording all actions with actor, timestamp, and metadata |
| **RapidBlock orchestration** | Creating derived snapshots, running child optimization, validating emergency jobs |
| **Actor authorization** | Checking planner allowlist for RapidBlock requests |

---

## The Critical Boundaries

### 1. KPI Numbers
**BACKEND OWNS**: The frontend must render `run.kpis.*` fields directly.  
**FRONTEND MUST NOT**: Calculate its own downtime reduction or closure time from raw schedule items.

### 2. Plan State (FEASIBLE vs. OPTIMAL vs. INFEASIBLE)
**BACKEND OWNS**: `run.state` is the authoritative plan quality signal.  
**FRONTEND MUST NOT**: Decide that a run is "good enough" based on schedule item counts.

### 3. Export Gate
**BACKEND OWNS**: `run.export_ready` boolean. The backend computes whether all conditions are met.  
**FRONTEND MUST NOT**: Show an enabled Export button when `export_ready === false`, even if `run.approval !== null`.

### 4. Reason Codes
**BACKEND OWNS**: All `reason_codes` on schedule items and AI estimates.  
**FRONTEND'S ONLY JOB**: Map these codes to human-readable strings. Do not interpret them further.

### 5. Approval Eligibility
**BACKEND OWNS**: The final check. `POST /approve` will return 409 if the plan is not approvable.  
**FRONTEND**: Should also guard the button based on known conditions (`validator.passed`, `state`, `approval === null`) to provide good UX — but must handle 409 errors gracefully if the guard fails.

---

## Error Code to User Message Mapping

The backend returns errors in this format:
```json
{ "code": "STALE_SNAPSHOT", "message": "The snapshot is not valid for planning" }
```

The frontend must translate these to user-facing messages:

| Backend Error Code | User-Facing Message |
|-------------------|---------------------|
| `STALE_SNAPSHOT` | "The planning data has expired. Please go back and re-upload your dataset." |
| `SNAPSHOT_NOT_FOUND` | "Dataset not found. Please validate your dataset before creating a plan." |
| `RUN_NOT_FOUND` | "Planning run not found. It may have expired or been deleted." |
| `INVALID_RUN_STATE` | "This action is not allowed in the current plan state." |
| `SCHEDULE_ITEM_NOT_FOUND` | "This job is not scheduled in the current plan." |
| `ALREADY_APPROVED` | "This plan has already been approved." (Refresh and redirect.) |
| `SAFETY_VALIDATION_FAILED` | "Independent safety validation did not pass. This plan cannot be approved." |
| `EXPORT_BLOCKED` | "Export is blocked. Ensure the plan is approved, feasible, and validated." |
| `OUTSIDE_PLANNING_SCOPE` | "The requested operation is outside the boundaries of the current planning dataset." |
| `UNAUTHORISED_ACTOR` | "You are not authorized to perform this action." |
| `NO_ELIGIBLE_WINDOW` | "No available maintenance window exists for this job." |
| `LOCK_CONFLICT` | "The emergency job conflicts with a locked schedule item." |
| `INVALID_INPUT` | "Invalid input. Please check your data and try again." |

For any unmapped `code`, show: `"An unexpected error occurred: [code]. Please contact support."`

---

## API Error HTTP Status Codes

| Status | Meaning | Frontend Action |
|--------|---------|-----------------|
| 400 | Invalid input | Show inline validation error or toast |
| 403 | Unauthorized | Show "Not authorized" message. Do NOT redirect to login (no auth system). |
| 404 | Resource not found | Show "Not found" message. Offer navigation back. |
| 409 | Invalid state transition | Show specific error message based on code. Often means stale UI — offer refresh. |
| 422 | Validation failure | Show field-level validation errors if applicable. |
| 500 | Server error | Show "Server error. Please try again later." with retry option. |
| Network error | No response | Show "Unable to connect to the server. Check your connection." |

---

## Synchronization After Mutations

Every mutation (POST/action) should be followed by a data refetch:

| Mutation | Refetch |
|---------|---------|
| `POST /datasets/validate` | Store `validation` result in state |
| `POST /planning-runs` | `GET /planning-runs/{new_run_id}` |
| `POST /planning-runs/{id}/lock` | `GET /planning-runs/{id}` |
| `POST /planning-runs/{id}/replan` | `GET /planning-runs/{new_run_id}` (new ID!) |
| `POST /planning-runs/{id}/approve` | `GET /planning-runs/{id}` |
| `POST /rapidblock-requests` | `GET /rapidblock-requests/{request_id}` |
| `POST /planning-runs/{child_id}/approve` | Navigate to Home (emergency complete) |

The existing `api.ts` client already handles the pattern for lock, replan, and approve (it calls GET after the mutation). This pattern should be preserved in the new UI.
