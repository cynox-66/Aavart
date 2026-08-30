# 13 — Interaction Patterns

Standard behaviour for all interactive elements in the application.

---

## Buttons

### Primary Button
- Full background color, white text
- Used for the single most important action per screen (e.g., "Continue", "Approve Plan", "Inject & Re-Optimize")
- Only one primary button per screen section

### Secondary Button
- Outlined, colored text, transparent background
- Used for supporting actions (e.g., "View Detailed Comparison", "Change Window")

### Destructive Button
- Red/danger styling
- Used for irreversible actions (e.g., "Exclude from Plan")
- Always requires confirmation before execution

### Disabled Button
- Reduced opacity, `cursor: not-allowed`
- **ALWAYS include a `title` attribute tooltip** explaining why it is disabled
- Example: `title="Re-optimize the plan before approving"`

### Loading Button
- Replace button label with spinner + in-progress text
- `disabled` attribute set
- Width should not change (prevents layout shift)

```typescript
// Pattern for loading buttons
<button disabled={isBusy} aria-busy={isBusy}>
  {isBusy ? (
    <><Spinner size="sm" /> Locking...</>
  ) : (
    "🔒 Lock in Schedule"
  )}
</button>
```

---

## Destructive Actions

Actions that cannot be undone (Exclude from Plan, Approve Emergency Dispatch) must follow this pattern:

1. User clicks the button
2. A `<ConfirmModal>` appears — never execute immediately
3. Modal shows:
   - Clear action title: "Exclude JOB-042 from this plan?"
   - Plain-language consequence: "This job will be removed from the current schedule. It will still appear in your dataset and can be included in future plans."
   - Two buttons: `[Cancel]` (default focus) and `[Confirm: Exclude]` (red, secondary focus)
4. Pressing Escape or clicking Cancel dismisses with no action
5. Pressing Enter does NOT confirm (prevents accidental keyboard trigger)

---

## Confirmation Modals

The `<ConfirmModal>` component (see [05-component-system.md](./05-component-system.md)) must be used consistently.

**Variants**:
- `default` — Standard confirmation (white background)
- `destructive` — Red accent border, destructive action (red Confirm button)
- `emergency` — Full emergency styling, used for "Approve Emergency Dispatch"

---

## Toast Notifications

Use toasts for transient feedback after actions. Do not use them for critical errors that block the user (use inline errors instead).

**Toast types**:
| Type | When | Duration |
|------|------|----------|
| ✅ Success | After lock, replan complete, export started | 4 seconds |
| ⚠️ Warning | After replan with degraded quality | 6 seconds, dismissible |
| ❌ Error | After network failure or unexpected error | 8 seconds, dismissible + Retry |
| ℹ️ Info | Plan staleness, informational | 5 seconds |

**Placement**: Bottom-center of the screen, stacked if multiple.

**Example messages**:
```
✅ JOB-042 has been locked in schedule.
✅ Re-optimization complete. 4 jobs were shifted.
✅ Plan approved successfully.
⚠️ Re-optimization produced a FEASIBLE (not OPTIMAL) result.
❌ Export failed. Try again.
```

---

## Modals and Drawers

### When to use a Modal
- For confirmations (destructive actions)
- For the Approve Plan sign-off form (Step 5)
- For viewing detailed comparison (View Detailed Comparison)

### When to use a Drawer (Slide-in Panel)
- For the expanded Timeline (`[Expand Timeline ↗]`)
- For the Job Inspector (right-side panel that updates without navigating away)

### Modal Rules
- Always provide a close action (X button and Escape key)
- Trap focus inside the modal
- Scroll the background content out from under the modal (use `overflow: hidden` on body)
- Return focus to the trigger button on close

### Drawer Rules
- The drawer should not cover the action that opened it
- Use a backdrop for drawers that cover important content
- Animate in from the side (left for Job Explorer, right for Inspector)

---

## Async Actions

**Pattern for all async API calls**:

```typescript
async function handleLock() {
  setBusy("lock");         // Disable all action buttons
  setError(null);           // Clear any previous error
  try {
    await lockScheduleItem(run.run_id, selectedJobId);
    setIsDirty(true);
    showToast({ type: "success", message: `${selectedJobId} locked.` });
    refetchRun();           // Refresh run data from backend
  } catch (error) {
    if (error instanceof ApiError) {
      setError(apiErrorToMessage(error.code));  // Show inline error
    } else {
      showToast({ type: "error", message: "Unexpected error. Try again." });
    }
  } finally {
    setBusy(null);           // Re-enable buttons
  }
}
```

**Rules**:
- Only one `busy` action at a time
- `finally` block always clears the busy state, even on error
- Network errors → toast notification
- Business logic errors (409, 403) → inline error near the relevant UI element

---

## Polling

The current backend executes the optimizer synchronously (no async worker). Polling is not needed.

If the backend is updated to use async workers, implement polling this way:

```typescript
async function pollUntilComplete(runId: string, intervalMs = 2000, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const run = await getPlanningRun(runId);
    if (["FEASIBLE", "OPTIMAL", "INFEASIBLE", "TIMEOUT", "FAILED"].includes(run.state)) {
      return run;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error("Polling timeout: run did not complete within expected time");
}
```

---

## Optimistic Updates

The current application uses **pessimistic updates** (wait for server confirmation before updating UI). This is the correct approach for a safety-critical operational system.

**Do NOT use optimistic updates for**:
- Lock action (the UI must reflect actual backend lock state)
- Replan (the new schedule must come from the backend)
- Approve (approval state must be confirmed by backend)
- Export (gated by backend; optimistic unlock would be a safety violation)

---

## Dirty State Warnings

If the user attempts to navigate away from a screen with unsaved state, show a warning:

**When to warn**:
- If `isDirty === true` (jobs locked but plan not yet re-optimized) and user tries to navigate away

**Warning dialog**:
```
You have unsaved constraints (N locked jobs).
If you leave without re-optimizing, the locked state
will be preserved but the plan quality may be incorrect.

[Cancel: Stay on page]  [Leave without re-optimizing]
```

Use the browser `beforeunload` event for browser tab close/navigate, and React Router's navigation guard for in-app navigation.

---

## Disabled Action States Summary

| Action | Disabled When | Tooltip |
|--------|--------------|---------|
| Continue (Check Data) | `validation.valid === false` | "Resolve all errors before continuing" |
| Create Plan | No valid snapshot | "Validate your data first" |
| Lock in Schedule | Already locked OR not scheduled OR plan approved | "Already locked", "Job is not in the schedule", "Plan is approved" |
| Re-Optimize | `!isDirty` OR `isBusy` | "No unsaved constraints to re-optimize" |
| Approve Plan | `isDirty` OR `!validator.passed` OR already approved OR state not FEASIBLE/OPTIMAL | "Re-optimize first", "Validation failed", "Already approved" |
| Export Plan | `!export_ready` | "Approve the plan to unlock export" |
| Find Alternative | NOT YET IMPLEMENTED | "Coming soon" |
| Change Window | NOT YET IMPLEMENTED | "Coming soon" |
| Exclude from Plan | NOT YET IMPLEMENTED | "Coming soon" |
