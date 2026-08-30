# 15 — Implementation Roadmap

This document provides the recommended implementation order for the frontend engineer. Follow this order to maximize testability and avoid building components that depend on unfinished pieces.

---

## Priority Ordering Principle

Build in this order:
1. Infrastructure that everything depends on (shell, routing, API client)
2. The core data flow (validation → plan creation)
3. The Review Plan screen (the most critical screen)
4. Supporting features (Inspector, Job Actions, Re-Optimize)
5. Approval and export flow
6. Emergency workflow (complex, but backend is ready)
7. Polish and edge cases

---

## Phase 1: Application Shell and Infrastructure

**Goal**: A running Next.js app with correct routing and a verified connection to the backend.

### Tasks

1. **Verify backend connectivity**
   - Run `GET /health` and confirm 200 response
   - Confirm `NEXT_PUBLIC_API_URL` is correctly configured
   - Confirm `apps/web/src/lib/api.ts` functions work in the browser

2. **Set up routing structure** (if not already in App Router format)
   ```
   app/
   ├── page.tsx           (Home)
   ├── plan/
   │   ├── new/page.tsx   (5-step wizard)
   │   └── [run_id]/page.tsx  (Review Plan)
   ├── emergency/page.tsx
   └── layout.tsx
   ```

3. **Create AppHeader component** with user profile pill

4. **Create WorkflowStepper component** (purely presentational — just pass current step as prop)

5. **Create shared utilities**:
   - `reasonCodeToLabel(code: string): string` — maps backend reason codes to human labels
   - `runStateToLabel(state: string): string`
   - `formatDateTime(iso: string): string`
   - `formatPercent(n: number): string`

**Dependency**: None — start here.

---

## Phase 2: Data Selection (Step 1)

**Goal**: A functional Select Data screen.

### Tasks

1. Build `SelectDataStep` component
2. Build `DepartmentDataRow` component (TMS, SMMS, TDMS rows)
3. Implement file upload with `FileReader`
4. Handle JSON and CSV file selection
5. Store combined dataset in React state for use in Step 2
6. Enable/disable Continue button based on whether at least one file is uploaded

**Dependency**: Phase 1 complete.

---

## Phase 3: Data Validation (Step 2)

**Goal**: A functional Check Data screen that calls the real backend.

### Tasks

1. Build `CheckDataStep` component
2. Build `ValidationSummary` component (All Good / Needs Attention)
3. Build `IssueCard` component
4. Wire `POST /datasets/validate` on screen entry
5. Store `snapshot_candidate_id` for use in Phase 4
6. Handle `valid: false` error display
7. Enable Continue only when `valid === true`

**Test**: Upload the fixture dataset at `fixtures/baseline_valid/dataset.json`. You should get `valid: true`.

**Dependency**: Phase 2 complete.

---

## Phase 4: Plan Creation (Step 3)

**Goal**: Trigger the optimizer and navigate to Review Plan on success.

### Tasks

1. Build `CreatePlanStep` component with animated progress checklist
2. Call `POST /planning-runs` with `snapshot_candidate_id` from Phase 3
3. Implement the timer-based progress animation (see [04-screen-specifications.md](./04-screen-specifications.md))
4. On success, call `GET /planning-runs/{run_id}` and navigate to Review Plan
5. Handle all failure states (INFEASIBLE, TIMEOUT, STALE_SNAPSHOT, network error)

**Dependency**: Phase 3 complete.

---

## Phase 5: Review Plan Core Layout (Step 4)

**Goal**: The Review Plan screen renders with real data from the backend (visual layout only, interactions in next phases).

### Tasks

1. Build the three-panel layout (left/main, right/inspector)
2. Build `CorridorOverview` component (static render first — just show sections and nodes)
3. Build `WeeklyTimelineSummary` (Gantt bars, derived from `schedule_items`)
4. Build `PlanImpactPanel` (render the 3 KPI metrics from `run.kpis`)
5. Build the task summary row (total tasks, integrated block count, etc.)
6. Verify: Load a real run and see the layout populated with data

**Dependency**: Phase 4 complete.

---

## Phase 6: Job Selection and Inspector

**Goal**: Clicking a job shows its full details in the Inspector.

### Tasks

1. Add `selectedJobId` state to the Review Plan page
2. Add click handlers to Gantt bars and Corridor Map nodes → `setSelectedJobId(job_id)`
3. Build `JobInspector` component:
   - Job details card (department, section, work_type, priority, scheduled time)
   - "WHY THIS TIME?" reason codes list (with human labels)
   - `< 2 of 26 >` navigation arrows
4. Build `JobActionPanel` (render all 4 buttons; Lock is functional, others are disabled with "Coming soon" tooltip)
5. Implement cross-component synchronization (Gantt ↔ Map ↔ Inspector all react to `selectedJobId`)

**Dependency**: Phase 5 complete.

---

## Phase 7: Lock and Re-Optimize

**Goal**: The user can lock jobs and trigger a global re-optimization.

### Tasks

1. Wire `POST /planning-runs/{run_id}/lock` when user clicks "Lock in Schedule"
2. Add `isDirty` state tracking
3. Build `GlobalPlanStatus` / `ReOptimizePanel` component
4. Show the "Unsaved Constraints" warning when `isDirty === true`
5. Wire `POST /planning-runs/{run_id}/replan` when user clicks "Re-Optimize Plan"
6. Handle new `run_id` from replan response (update active run reference)
7. Implement the shimmer animation during optimization (blur Gantt/Map, keep locked jobs solid)
8. Show success toast with job change count
9. Handle INFEASIBLE replan result (preserve current plan, highlight conflicting jobs)

**Dependency**: Phase 6 complete.

---

## Phase 8: Approval Flow

**Goal**: The user can approve the plan and see the approved state.

### Tasks

1. Build the `ApprovePlanStep` component (form with reviewer + comment fields)
2. Guard Approve button correctly (all conditions: `!isDirty`, `validator.passed`, `approval === null`, `state` is FEASIBLE/OPTIMAL)
3. Wire `POST /planning-runs/{run_id}/approve`
4. Build `PlanApproved` page/component
5. Hide Approve button and show Export/Print/Share on approved state (`approval !== null`)
6. Wire `GET /planning-runs/{run_id}/export` for the Export Plan button

**Dependency**: Phase 7 complete.

---

## Phase 9: Home Screen and Previous Plans

**Goal**: A polished Home screen entry point.

### Tasks

1. Build `Home` page with the three action tiles
2. Add the feature bullet point summary
3. Add user profile pill in the header
4. `View Previous Plans` — show "No plans yet" empty state (list endpoint not yet available)
5. Add navigation to Emergency Rapid-Block Mode

**Dependency**: None (can be done in parallel with Phase 2–3).

---

## Phase 10: Emergency Rapid-Block Mode

**Goal**: The complete emergency workflow.

### Tasks

1. Build `EmergencyMode` page (separate from wizard)
2. Build `EmergencyIncidentForm` (dropdowns and inputs)
3. Determine how to populate form dropdowns (sections, assets, windows) — see [16-open-questions.md](./16-open-questions.md)
4. Build `CorridorMapPanel` (corridor visualization for emergency mode)
5. Wire `POST /rapidblock-requests`
6. Build `CascadeImpactPanel` (changed jobs count, preserved locked jobs)
7. Handle CANDIDATE_READY state → enable Approve Emergency Dispatch
8. Handle NO_CANDIDATE and REJECTED states
9. Wire `POST /planning-runs/{child_run_id}/approve` for emergency dispatch
10. Build success modal and return to Home navigation

**Dependency**: Phase 8 complete (need to understand approval flow pattern).

---

## Phase 11: Polish, Edge Cases, and Testing

**Goal**: Production-quality robustness.

### Tasks

1. Add all tooltip text to disabled buttons
2. Add all loading skeleton states
3. Add all toast notifications
4. Add all error handling with specific messages (see [07-backend-integration.md](./07-backend-integration.md))
5. Add dirty state navigation warning (`beforeunload` event)
6. Add responsive layout (tablet and mobile adaptations per [14-responsive-behaviour.md](./14-responsive-behaviour.md))
7. Write Playwright E2E tests for the core flow (validate → plan → approve → export)
8. Add keyboard navigation (all interactive elements must be keyboard-accessible)
9. Test with the actual `fixtures/baseline_valid/dataset.json` fixture dataset

---

## Dependency Graph

```
Phase 1 (Shell)
    ↓
Phase 2 (Select Data) ──────────────→ Phase 9 (Home) [parallel OK]
    ↓
Phase 3 (Check Data)
    ↓
Phase 4 (Create Plan)
    ↓
Phase 5 (Review Plan Layout)
    ↓
Phase 6 (Job Inspector)
    ↓
Phase 7 (Lock + Re-Optimize)
    ↓
Phase 8 (Approval + Export)
    ↓
Phase 10 (Emergency Rapid-Block) ← needs understanding of approval pattern
    ↓
Phase 11 (Polish)
```

---

## What to Demo First (Minimum Viable Demo)

If time is critical, the minimum judge-ready demo path is:

1. Phase 1 + 3 (skip Step 1 UI, use the fixture dataset directly)
2. Phase 4 (create plan)
3. Phase 5 + 6 (see the plan and inspect a job)
4. Phase 7 minimal (lock a job + replan)
5. Phase 8 (approve + export)

This gives a complete end-to-end flow that shows:
- Data validation
- AI optimization
- Human review and inspection
- Lock constraint + re-optimization
- Human approval gate
- Export gating

Add Phase 10 (Emergency Rapid-Block) after the core flow is solid, as per the `winning_gap_checklist.md`.
