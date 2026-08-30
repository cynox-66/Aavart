# 16 — Open Questions and Known Gaps

This document tracks all unresolved items: missing backend endpoints, unresolved data structures, assumptions made, and decisions that need clarification before implementation.

Do not hide uncertainty here. If something is unclear, it belongs in this file.

---

## Missing Backend Endpoints

### 1. List Planning Runs
**Required for**: "View Previous Plans" feature on the Home screen.
**Status**: NOT IMPLEMENTED
**Current behavior**: The backend stores runs in-memory (or Postgres if `STORE_BACKEND=sql`), but there is no `GET /planning-runs` list endpoint.
**Impact**: The "View Previous Plans" button cannot show a real list. Must either show an empty state or be deferred.
**Recommendation**: Add `GET /planning-runs` with pagination to the backend. Or, persist the latest `run_id` in `localStorage` and only support "View Current Plan".

---

### 2. Get Snapshot Dataset Entities
**Required for**: The Emergency Rapid-Block Form dropdowns (Section, Asset, allowed Windows).
**Status**: NOT IMPLEMENTED
**Current behavior**: `GET /planning-runs/{run_id}` returns `jobs[]` with `section_id` and `asset_id`, but not the full list of available sections, assets, windows, and resources from the base snapshot.
**Impact**: The Emergency Rapid-Block form cannot populate its dropdowns (Section/Location, Available Windows) without this data. The frontend cannot construct a valid `urgent_job` payload.
**Possible workarounds**:
  - (A) Derive available sections from `run.jobs[].section_id` (unique values). This is a partial workaround — it gives sections but not windows.
  - (B) Add `GET /datasets/{snapshot_id}` endpoint that returns the full `DatasetPayload`.
  - (C) Add `snapshot_entities` to the `PlanningRunDetail` response (sections, windows, resources list).
**Recommendation**: Option C (least breaking change) — add a `snapshot_entities` field to `GET /planning-runs/{run_id}` that returns available sections and windows.

---

### 3. Unlock a Job
**Required for**: Allowing a planner to undo a lock if they made a mistake.
**Status**: NOT IMPLEMENTED
**Current behavior**: `POST /planning-runs/{run_id}/lock` sets `locked = true`. There is no unlock endpoint. The only way to remove a lock is to create a new run.
**Impact**: If a planner accidentally locks a job, they have no recovery path other than re-running the full optimizer.
**Recommendation**: Add `DELETE /planning-runs/{run_id}/lock/{job_id}` or a `POST /planning-runs/{run_id}/unlock` endpoint.

---

### 4. Find Alternative Slot for a Job
**Required for**: The "Find Alternative" action button in the Job Inspector.
**Status**: NOT IMPLEMENTED
**Current behavior**: The `/replan` endpoint performs a global re-optimization, not a per-job alternative search.
**Impact**: The "Find Alternative" button cannot be implemented. It will show as disabled ("Coming soon").
**Recommendation**: Add `POST /planning-runs/{run_id}/jobs/{job_id}/alternative` that returns 1–3 alternative window options for just that job.

---

### 5. Exclude a Job from a Plan
**Required for**: The "Exclude from Plan" action button in the Job Inspector.
**Status**: NOT IMPLEMENTED
**Current behavior**: There is no endpoint to exclude a specific job from the current plan without re-running the optimizer.
**Impact**: The "Exclude from Plan" button cannot be implemented. It will show as disabled ("Coming soon").
**Recommendation**: Add `POST /planning-runs/{run_id}/jobs/{job_id}/exclude` that creates a child run with the specified job excluded.

---

### 6. Share Plan with Teams
**Required for**: "Share with Teams" action on the Plan Approved screen.
**Status**: NOT IMPLEMENTED — No sharing or notification mechanism exists.
**Impact**: The "Share with Teams" tile on the Plan Approved screen cannot function.
**Workaround**: Show the button but clicking it could copy a share link or show a "Coming soon" message.

---

## Data Structure Gaps

### 7. Job Location (km range) in Job Inspector
**Required for**: Displaying "Location: Km 512/8 – 518/4" in the Job Inspector.
**Current data**: `JobContext` provides `asset_id` and `section_id`, but no geographic km range.
**Impact**: The km location field in the Inspector cannot be displayed.
**Assumption made**: The location field in the Inspector wireframe (`Km 512/8 – 518/4`) is derived from the asset, which is stored in the backend but not returned in `JobContext`. Either (a) enrich `JobContext` with asset details, or (b) show `asset_id` as the location identifier instead.

---

### 8. Affected Commercial Trains Count in Cascade Impact
**Required for**: Showing "2 Commercial trains will be delayed" in the Emergency Rapid-Block cascade impact panel.
**Current data**: `RapidBlockDetail.changed_jobs` shows affected maintenance jobs. There is no field for affected commercial trains.
**Impact**: The "Commercial trains delayed" count in the cascade impact panel cannot be displayed accurately.
**Assumption made**: This count may be derivable from `train_paths` in the dataset — if a train path overlaps with the emergency block's section and time window, it is "affected". This logic would need to be implemented on the frontend or added to the backend response.

---

## Assumptions Made

### 9. Optimizer is Synchronous
**Assumption**: `POST /planning-runs` and `POST /planning-runs/{id}/replan` return only when the optimizer is complete.
**Risk**: If the backend moves to an async worker model, the frontend will need to implement polling.
**Evidence**: Current source code in `planning_runs.py` calls `_execute_run()` synchronously and returns `_created(run)` only after it completes.
**Action needed if wrong**: Implement polling on `GET /planning-runs/{run_id}` until state leaves `QUEUED`/`RUNNING`.

---

### 10. Ruleset Version is Hardcoded
**Assumption**: The ruleset version is always `"Demo Ruleset v1"` as hardcoded in `api.ts`.
**Evidence**: `planning_runs.py` line 45: `RULESET_VERSION = "Demo Ruleset v1"`. The API rejects any other value.
**Impact**: The frontend cannot allow the user to select a ruleset. This is fine for the demo.
**Action needed if wrong**: If multiple rulesets are added, the frontend must add a ruleset selector to the Create Plan step.

---

### 11. Actor Authorization for RapidBlock
**Assumption**: The planner's actor name (used in `POST /rapidblock-requests`) must match one of the names in the `PLANNER_ALLOWLIST` environment variable in the backend.
**Evidence**: `rapidblock.py` calls `_allowed_planners()` which reads `settings.planner_allowlist`.
**Impact**: If the frontend sends an actor name not in the allowlist, the request returns `REJECTED: UNAUTHORISED_ACTOR`.
**Action needed**: The default allowlist must include the demo user's name. Check `.env` for the current `PLANNER_ALLOWLIST` value and ensure the UI's hardcoded actor name matches.

---

### 12. No Authentication System
**Assumption**: There is no login/authentication system. The user's name and role are set by the UI (or hardcoded for the demo).
**Evidence**: No auth routes in the backend. The `reviewer` field in approve requests is a free text string.
**Impact**: The "Divisional Manager — WR Vadodara" display in the header is static or set via a simple profile field. Anyone with access to the URL can approve plans.
**Action needed for production**: Implement proper authentication with role-based access control.

---

### 13. Single Concurrent User
**Assumption**: For the hackathon demo, only one person is using the system at a time. Concurrent editing and real-time synchronization are out of scope.

---

## Decisions Needed

### 14. How to persist `run_id` across sessions?
If the user closes the browser and reopens it, how do they get back to their plan?

**Options**:
- (A) Store `run_id` in `localStorage` — simple, but stale if backend memory store resets
- (B) Store in URL query parameter `/plan/review?run_id=RUN-001` — shareable, browser-back works
- (C) Always start fresh — simplest, but loses work on refresh

**Recommendation**: Option B (URL-based) — clean React pattern and most resilient.

---

### 15. Wizard vs. Separate Pages?
Should the 5-step wizard use URL-based routing (`/plan/step/2`) or a single-page state machine?

**Options**:
- (A) Single page with step state in React — simpler, no back/forward browser support
- (B) URL-based routing per step — supports browser back, bookmarkable

**Recommendation**: Option A for simplicity. Document this as a known limitation.

---

### 16. Is the Gantt Chart a custom SVG or a library?
The Weekly Timeline (Gantt chart) can be built with:
- (A) Custom SVG (like the existing `planner-dashboard.tsx` corridor schematic)
- (B) A library like `react-gantt-task` or `dhtmlx-gantt`

**Recommendation**: Option A (custom SVG or Canvas) for full control over styling and interactions. The existing code demonstrates this pattern.

---

## Future Scope (Out of Current Hackathon Scope)

- Monthly planning horizon (SIH requirement gap — only weekly is implemented)
- Live TMS/SMMS/TDMS adapter integration (only CSV/JSON upload exists)
- Multi-corridor planning
- Real authentication and role-based access control
- Multi-user real-time collaboration
- PostgreSQL persistence (currently in-memory for most scenarios)
- Monthly view in the UI
