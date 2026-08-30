# 04 — Screen Specifications

Each screen is documented with its purpose, layout, data requirements, interactions, API calls, and exit conditions.

---

## Screen 0: Home / Welcome

**Purpose**: Entry point. Give the user three clear paths.

**Entry condition**: App loads, no active wizard state.

**UI Regions**:
- **Logo + Branding**: RailNiyojan logo, "Integrated Block Planning" tagline.
- **Feature summary**: 3 bullet points highlighting the system's value (e.g., "Optimize multi-department maintenance schedules", "Reduce track downtime with CP-SAT optimization", "Ensure zero-conflict, safety-compliant planning").
- **User profile pill** (top-right): Shows current user's name and division (e.g., "AR — Divisional Manager, WR - Vadodara").
- **Three action buttons**:
  1. `[ ▶ Start New Plan ]` — Primary action, dark background
  2. `[ 📁 View Previous Plans ]` — Secondary action
  3. `[ 🚨 Emergency Block Planning ]` — Destructive/urgent styling, red accent

**Data required**: None (static screen).

**Loading states**: None.

**Exit conditions**:
- Click "Start New Plan" → Navigate to Step 1: Select Data
- Click "View Previous Plans" → Navigate to Plans List
- Click "Emergency Block Planning" → Navigate to Emergency Rapid-Block Mode

---

## Screen 1: Select Data (Step 1 of 5)

**Purpose**: Ingest maintenance job data from the three departments.

**Entry condition**: User clicked "Start New Plan".

**UI Regions**:
- **WorkflowStepper**: Steps 1–5. Step 1 is active.
- **Main heading**: "Add Planning Data — Upload or select the latest data for this planning period"
- **Three department rows**:
  - Track Maintenance (TMS) — `[Add] [Skip]`
  - Signal Maintenance (SMMS) — `[Add] [Skip]`
  - Traction Maintenance (TDMS) — `[Add] [Skip]`
- **Planning Period panel** (right): `[Weekly] [Monthly]` toggle, "About this data" section explaining the data format, and tips for the user.
- **Bottom actions**: `[Cancel]` `[Continue]`

**Data required**: None from API. User provides files.

**User Actions**:
- Click `[Add]` on a department → Opens file picker. Accepts `.csv` or `.json`.
- Click `[Skip]` on a department → That department's data is excluded from this plan.
- Toggle `[Weekly]` / `[Monthly]` → Sets planning horizon.
- Click `[Continue]` → Combines all uploaded data into a single payload and proceeds.

**API calls**: None on this screen. Validation happens on the next screen.

**Loading states**: After clicking [Add], show a small spinner on the row while the file is read by `FileReader`.

**Error states**: If the selected file cannot be parsed as JSON, show an inline error on that row: "Invalid file format. Expected CSV or JSON."

**Exit conditions**:
- `[Continue]` with at least one department's data → Go to Step 2: Check Data
- `[Cancel]` → Return to Home

**Important constraint**: At least one department must have data. "Skip All" should disable the Continue button with tooltip: "At least one department dataset is required."

---

## Screen 2: Check Data (Step 2 of 5)

**Purpose**: Show the user the validation results before running the optimizer.

**Entry condition**: User clicked Continue from Step 1.

**API Call on Entry**: `POST /datasets/validate` fires immediately on entering this screen with the combined dataset payload.

**Loading state**: Show "Validating your data..." spinner while the API call is in flight.

**UI Regions (All Good state)**:
- **Main heading**: "CHECK YOUR DATA — We're validating the information before creating the plan"
- **All Good panel** (green, ✅): "Data is complete. No major conflicts found. N maintenance tasks ready."
- **Needs Attention panel** (if present, amber ⚠️): Shows count of issues.
- **Summary panel** (right): Shows counts — `N jobs`, `N windows`, `N sections`, `Snapshot: SNAP-XXX`.
- **Bottom actions**: `[Cancel]` `[Continue]`

**Needs Attention Expanded State**:
When the user clicks the "Needs Attention" row, it expands to show a list of specific issues. Each issue shows:
- **Issue type** (e.g., "Missing Data: Priority Value")
- **Affected job** (e.g., "Job ID: TMS-042")
- **Problem description** (e.g., "The 'Priority' column is empty")
- **Suggested action** (e.g., "Assign default 'Medium' priority")
- `[✓ Auto-Fix]` button (if available) or `[✏️ Edit Manually]` button

**Blocking vs. Non-Blocking Warnings**:
- If `validation.valid === false` (errors present): Continue button is **disabled**. Show: "Please resolve all errors before continuing."
- If `validation.valid === true` but warnings exist: Continue button is **enabled**. Show: "You may continue with warnings. The optimizer will handle minor conflicts."

**API calls**:
- `POST /datasets/validate` — fires on screen entry
- On success: Store `validation.snapshot_candidate_id` for use in Step 3

**Error states**:
- Network failure: Show "Validation failed — unable to reach the server. Please check your connection and try again." with a Retry button.
- `valid: false`: Show each error from `validation.errors[]` in the Needs Attention panel.

**Exit conditions**:
- `[Continue]` when `validation.valid === true` → Navigate to Step 3: Create Plan
- `[Cancel]` → Return to Home (with confirmation if data was uploaded)

---

## Screen 3: Create Plan (Step 3 of 5)

**Purpose**: Trigger the backend optimizer and show progress while it runs.

**Entry condition**: User clicked Continue from Check Data. `validation.snapshot_candidate_id` is available.

**API Call on Entry**: `POST /planning-runs` fires immediately with `{ snapshot_id: validation.snapshot_candidate_id, ruleset_version: "Demo Ruleset v1" }`.

**UI Regions**:
- **Left panel**: 
  - "Creating Your Plan"
  - Sub-heading: "Finding the best way to do most maintenance with least amount of disruption."
  - Progress checklist (animated step-by-step):
    1. `[ ] Parsing multi-department inputs...`
    2. `[ ] Identifying spatial & temporal conflicts...`
    3. `[ ] Running CP-SAT Optimization Engine...`
    4. `[ ] Validating safety constraints...`
    5. `[ ] Generating reason codes & KPI metrics...`
  - Progress bar at bottom
- **Right panel**: An illustrative image or abstract animation of a train/corridor.
- **Bottom actions**: `[Cancel]` (left) `[Continue]` (right, initially disabled)

**Progress Behavior**:

> **IMPORTANT**: The backend currently runs the optimizer **synchronously**. `POST /planning-runs` blocks until the run is complete. The frontend cannot receive real-time progress events.

Recommended approach (Option C from the spec): The frontend simulates progress by advancing the checklist items on a timer while the API call is in flight. When the API resolves, the checklist completes instantly and the Continue button enables.

The timer-based approach:
- Items 1–4: Auto-advance every ~600ms (total ~2.4 seconds of visual progress)
- Item 5: Hold until API call resolves

Do NOT show a fake "72%" progress bar that suggests server-side progress tracking that doesn't exist.

**States**:
- `pending` → Show spinner, checklist items are grey
- `processing` → Checklist animates forward
- `completed` → All items checked, Continue button enables, auto-advance after 500ms
- `failed` → Show error inline (see below)

**Error states**:
- `STALE_SNAPSHOT` (409): "The dataset snapshot has expired. Please go back and re-upload your data." with `[< Back to Check Data]` button.
- `INVALID_INPUT` (400): "Invalid ruleset configuration. Contact support." (This should not happen in normal flow.)
- Network failure: "Could not connect to the optimization service. Please try again." with Retry button.
- `state: INFEASIBLE`: "No valid schedule could be found with the provided data. The optimizer could not satisfy all constraints. Consider relaxing requirements or uploading updated data." with `[< Back]` button.
- `state: TIMEOUT`: "The optimizer timed out. A partial result may be available. Continue to review what was scheduled, or go back and simplify the dataset." with both `[Continue with partial]` and `[< Back]` buttons.

**Exit conditions**:
- API returns successfully with FEASIBLE or OPTIMAL run → Auto-navigate to Step 4: Review Plan (passing `run_id`)
- `[Cancel]` → Return to Home (with confirmation prompt)
- `[< Back]` on error → Return to Step 2

---

## Screen 4: Review Plan (Step 4 of 5)

**Purpose**: The primary workspace. The user reviews the AI-generated schedule, inspects jobs, and optionally modifies the plan.

This is the most complex screen. See the dedicated document: [10-review-plan.md](./10-review-plan.md).

**Entry condition**: Planning run returned with `state: FEASIBLE` or `state: OPTIMAL`.

**API Call on Entry**: `GET /planning-runs/{run_id}` to load the full `RunDetail`.

**Exit conditions**:
- `[Approve Plan →]` → Navigate to Step 5: Approve Plan
- `[Export Plan]` → Only enabled after approval

---

## Screen 5: Approve Plan (Step 5 of 5)

**Purpose**: Formal human sign-off before the plan is finalized and export is unlocked.

**Entry condition**: User clicks "Approve Plan" from Review Plan. Plan must be FEASIBLE or OPTIMAL with validator passed.

**UI Regions**:
- **WorkflowStepper**: Step 5 is active.
- **Central confirmation card**:
  - ✅ Icon
  - "Ready for Approval"
  - Plan ID: `SNAP-014`
  - Summary metrics: N maintenance tasks, N integrated blocks, -36% closure time, Plan Quality: Optimal
- **Reviewer input**: Text field for reviewer name
- **Comment input**: Text area for approval remarks
- **Bottom actions**: `[← Go Back]` `[✍️ Digitally Sign & Approve]`

**Guard conditions** for the Approve button:
- `reviewer.trim().length > 0`
- `comment.trim().length > 0`
- `run.approval === null` (not already approved)
- `run.validator.passed === true`
- `run.state === "FEASIBLE" || run.state === "OPTIMAL"`

**API Call**: `POST /planning-runs/{run_id}/approve` with `{ reviewer, comment }`.

**Loading state**: Button shows "Approving..." and is disabled.

**Success**: Navigate to Plan Approved screen.

**Error states**:
- `ALREADY_APPROVED` (409): "This plan has already been approved." (Stale UI state — refetch and redirect to Approved screen.)
- `SAFETY_VALIDATION_FAILED` (409): "Independent safety validation did not pass. This plan cannot be approved. Please create a new plan." with `[Start New Plan]` button.
- `INVALID_RUN_STATE` (409): "Only a feasible, validated plan can be approved."

---

## Screen 6: Plan Approved

**Purpose**: Confirmation and post-approval actions.

**Entry condition**: `POST /approve` returned success.

**UI Regions**:
- **WorkflowStepper**: Step 5 remains highlighted.
- **Central success card**:
  - Large ✅ icon with animation
  - "PLAN APPROVED !"
  - "Plan SNAP-014 has been approved and is ready for export."
  - Summary metrics (from `run.kpis`): N tasks, N integrated blocks, -X% closure time, Plan Quality
- **"What's Next?" action grid** (4 tiles):
  1. `[📥 Export Plan]` — Downloads CSV via `GET /{run_id}/export`
  2. `[🖨️ Print Plan]` — Browser print dialog
  3. `[👥 Share with Teams]` — `NOT YET IMPLEMENTED`
  4. `[+ Create New Plan Version]` — Starts a new wizard with the same snapshot

**Export state**:
- Only available when `run.export_ready === true`
- If `export_ready === false` for any reason, show tooltip: "Export not available. Ensure plan is approved and validator has passed."

**Error states**:
- `EXPORT_BLOCKED` (409): "Export requires a valid, safe, human-approved run. Please check plan status."
- Network failure on export: Show toast "Download failed. Please try again."

---

## Screen 7: Emergency Rapid-Block Mode

**Purpose**: Inject an emergency maintenance job into the currently active plan, bypassing the normal 5-step flow.

**Entry condition**: User clicked "Emergency Block Planning" from Home. A current active approved plan must be available (or the user selects a `base_run_id`).

This screen is documented in detail in [11-rapid-blocking.md](./11-rapid-blocking.md).

---

## Screen 8: View Previous Plans (Plans List)

> **NOT YET IMPLEMENTED** — Backend does not have a list endpoint.

**ASSUMPTION**: This screen would show a table/list of past planning runs with columns: Plan ID, Snapshot, Status, Created At, Approved By, Actions.

When implemented, clicking a plan opens the Review Plan screen in read-only mode (approved plan, no Approve button, shows Export/Share).
