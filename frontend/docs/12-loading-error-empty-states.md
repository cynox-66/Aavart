# 12 — Loading, Error, and Empty States

Every screen must handle more than just the happy path. This document specifies the expected UX for all non-happy-path states.

---

## Global Principles

1. **Never show a blank screen** — always indicate what is happening or why nothing is shown.
2. **Never hide errors** — always show a meaningful message and a recovery action.
3. **Never disable actions silently** — disabled buttons must have tooltips explaining why.
4. **Never show fake progress** — only animate things that are actually happening (exception: the Create Plan step timer, which is explicitly documented).

---

## Loading States

### Initial Page Load (Review Plan)

When the Review Plan screen loads with a `run_id`, the full `RunDetail` must be fetched before rendering.

**Behaviour**: Show a full-panel skeleton layout that mirrors the actual layout:
- Top-left: Corridor skeleton (grey rounded rectangle)
- Bottom-left: Gantt skeleton (rows of grey bars)
- Bottom-center: KPI card skeletons (3 grey boxes)
- Right panel: Inspector skeleton (grey lines of text)

Do NOT show "Loading..." text alone. The skeleton must match the real layout structure.

### API Call In Progress (Inline)

For actions like Lock, Approve, Export that happen while the screen remains visible:

- The triggering button shows a spinner and "Locking..." / "Approving..." / "Downloading..."
- The button is disabled (`disabled` attribute)
- No other action buttons are clickable while busy (set a global `isBusy` flag)
- Do NOT blur or grey out the entire page

### Optimization In Progress (Re-Optimize)

Special case — the Gantt chart and Corridor Map should indicate that the optimizer is running on their data.

**Behaviour**:
- Apply a shimmer animation over the Gantt chart bars (like a loading skeleton)
- Apply a pulsing blur filter over the Corridor Map section cards
- **Exception**: Locked jobs in the Gantt chart must remain fully visible and unblurred — this visually communicates "the AI is working around your locked anchors"
- The Re-Optimize button shows "⚙️ Optimizing..." with a spinner
- The Approve Plan button is disabled
- All job action buttons are disabled

### Create Plan Progress

See [04-screen-specifications.md Step 3](./04-screen-specifications.md) for the animated progress checklist approach.

---

## Empty States

### No Jobs in Dataset

If `run.schedule_items.length === 0` after a successful plan creation:

```
+----------------------------------------+
|  🗓️                                   |
|  No maintenance jobs were scheduled    |
|                                        |
|  The optimizer could not place any     |
|  jobs from the current dataset.        |
|  Check the validation results and      |
|  dataset quality.                      |
|                                        |
|  [View Unscheduled Jobs]  [Start Over] |
+----------------------------------------+
```

### No Validation Issues

When `POST /datasets/validate` returns `valid: true` with `errors: []`:

```
+----------------------------------------+
|  ✅ All Good                           |
|  Data is complete and ready.           |
|  N maintenance tasks loaded.           |
|  Snapshot: SNAP-ABC123                 |
+----------------------------------------+
```

This is a success state, not a true "empty state," but should still be clearly communicated.

### No Previous Plans

If "View Previous Plans" is clicked but no plans exist (when endpoint is implemented):

```
+----------------------------------------+
|  📋 No Plans Yet                       |
|                                        |
|  You haven't created any plans.        |
|  Start your first integrated block     |
|  planning run.                         |
|                                        |
|  [Start New Plan]                      |
+----------------------------------------+
```

### No Selected Job in Inspector

When the Review Plan screen loads and no job has been explicitly selected:

```
+-----------------------------+
|  JOB INSPECTOR              |
|                             |
|  Select a job from the      |
|  timeline or corridor map   |
|  to inspect it here.        |
+-----------------------------+
```

---

## Error States

### Network Failure (Request Timeout / No Response)

Show a non-blocking toast notification:

```
[🔴] Unable to connect to the server.
     Check your connection and try again.    [Retry]
```

If a critical initial load fails (e.g., the Review Plan page can't load the run), show a full-page error:

```
+----------------------------------------+
|  ⚠️ Connection Error                   |
|                                        |
|  Could not load the plan data.         |
|  The backend may be unavailable.       |
|                                        |
|  [Try Again]      [← Go to Home]       |
+----------------------------------------+
```

### Validation Errors (Check Data screen)

When `validation.valid === false`:

Show the Needs Attention panel. Each error in `validation.errors` renders as an `<IssueCard>`:

```
⚠️  Missing Priority Value
    Affected: Job TMS-042 (row 14 in CSV)
    Issue: The 'priority' column is empty for this job.
    Impact: The optimizer cannot prioritize this job correctly.
    
    [✓ Auto-Fix: Set to default 'Medium' priority]
    [✏️ Edit Manually]
```

After the error list, show:
```
Continue is blocked until all errors are resolved.
[2 errors remaining]
```

### Plan Infeasible (INFEASIBLE state)

When `run.state === "INFEASIBLE"` after plan creation:

```
+----------------------------------------+
|  ❌ No Valid Schedule Found             |
|                                        |
|  The optimizer could not find a        |
|  schedule that satisfies all           |
|  constraints with the current data.    |
|                                        |
|  Common causes:                        |
|  • Too many jobs for available windows |
|  • Resource conflicts                  |
|  • Incompatible time requirements      |
|                                        |
|  [← Go Back to Check Data]  [Retry]   |
+----------------------------------------+
```

Also show the `unscheduled_jobs` list with their `reason_codes`.

### Re-Optimization Failure

When `POST /replan` fails with an INFEASIBLE state or the new run returns INFEASIBLE:

**Inline error on the Global Re-Optimize panel** (do not navigate away):
```
❌ Re-Optimization Failed

The locked constraints could not be satisfied.
Two or more locked jobs may conflict with each other.

Conflicting jobs are highlighted in red.    ← Highlight jobs with ISOLATION_CONFLICT etc.

[🔄 Retry Re-Optimize]  [↩ Review Locks]
```

The previous plan data must be preserved and displayed. Do NOT blank out the Gantt chart.

### Approval Failure

When `POST /approve` returns an error:

Show an inline error on the Approve form:

| Error Code | Inline Message |
|-----------|----------------|
| `SAFETY_VALIDATION_FAILED` | "❌ Independent safety validation did not pass. This plan cannot be approved. Please create a new plan." |
| `INVALID_RUN_STATE` | "❌ Only a feasible, validated plan can be approved." |
| `ALREADY_APPROVED` | (Refetch run and redirect to approved state) |
| `STALE_SNAPSHOT` | "❌ The planning dataset has expired. Please create a new plan." |

### Export Failure

When `GET /export` returns `EXPORT_BLOCKED`:

Show a toast (not a blocking error, since the user is already on the Approved screen):

```
[⚠️] Export blocked. The plan must be approved and
     validated before export is available.    [Dismiss]
```

### RapidBlock Rejection

When `POST /rapidblock-requests` returns state `REJECTED`:

Show on the right panel (do not block the form):

```
+------------------------------------------+
|  ❌ Request Rejected                     |
|                                          |
|  UNAUTHORISED_ACTOR:                     |
|  You are not authorized to submit        |
|  emergency requests.                     |
|                                          |
|  Contact your division administrator.   |
|                                          |
|  [← Return to Home]                     |
+------------------------------------------+
```

For `NO_ELIGIBLE_WINDOW`:
```
+------------------------------------------+
|  ⚠️ No Feasible Slot Found               |
|                                          |
|  The optimizer could not find a          |
|  maintenance window for this emergency   |
|  block.                                  |
|                                          |
|  Consider:                              |
|  • Reducing the estimated duration       |
|  • Selecting a different section         |
|  • Trying a different time of day        |
|                                          |
|  [Modify and Retry]                      |
+------------------------------------------+
```

---

## Plan Staleness States

### Stale Plan Warning

If the user has the Review Plan open and another user or process approves the plan externally (not likely in current single-user demo but important for future):

Show a dismissible banner at top:
```
[ℹ️] This plan may have been updated by another session. [Refresh Plan]
```

### Run State Degradation

If a plan was `FEASIBLE` but the validator subsequently fails (e.g., data changes invalidate it):

Show a warning banner on the Review Plan screen:
```
[⚠️] This plan has failed independent validation.
     Approval is blocked until the issue is resolved.
     [View Validation Issues]
```

---

## Timeout Handling

If `POST /planning-runs` appears to hang (no response after 30 seconds, which would indicate a backend issue):

```
[⏱️] This is taking longer than expected.
     The optimizer may be working on a complex dataset.
     [Wait longer]  [Cancel and go back]
```

Note: In the current synchronous backend implementation, requests should complete within a few seconds for demo-sized datasets. A 30-second timeout should be sufficient.
