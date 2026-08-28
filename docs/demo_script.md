# Demo Script

Target duration: five minutes or less.

## 1. Upload and validate

Load `baseline_valid` sample data. Show valid counts, the snapshot ID, and `Demo Ruleset v1`.

Expected: validation succeeds and planning is enabled.

## 2. Run the planner

Start a weekly planning run.

Expected: the UI shows `RUNNING`, then `FEASIBLE` or `OPTIMAL`, with schedule items and solver metadata.

## 3. Explain the result

Show one scheduled job and one unscheduled job.

Expected: both have stable reason codes; the unscheduled job has a readable blocking reason.

## 4. Lock and re-plan

Lock one accepted schedule item. Trigger re-planning for its affected section or window.

Expected: the locked item remains unchanged; other affected unlocked jobs may change; the new run has a new run ID.

## 5. Review and approve

Show validator status, assumptions, solver state, and the changed/preserved summary. Approve the valid result.

Expected: approval records reviewer, timestamp, snapshot ID, and ruleset version.

## 6. Export

Export the approved CSV/PDF.

Expected: export succeeds and contains approval metadata. State clearly that this is a recommendation export, not BDMS sanctioning.

## Presenter rules

- Do not claim live railway integration.
- Do not claim automatic sanctioning.
- Do not claim validated ML.
- If a run is infeasible or times out, show that export is correctly blocked rather than hiding the failure.
