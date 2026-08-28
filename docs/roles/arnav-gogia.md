# Arnav Gogia: Frontend

## Own

- Upload and validation screens.
- Planning run status and results.
- Schedule, unscheduled reasons, locks, re-plan, approval, and export states.

## Must implement

- Render canonical fields without renaming their meaning.
- Show snapshot ID, ruleset version, run state, and approval state.
- Make unsafe, stale, invalid, or unapproved export visibly unavailable.
- Show preserved locked jobs after re-planning.
- Handle API errors using stable error codes and readable messages.

## Must not implement

- Fake success states disconnected from backend results.
- A UI that implies automatic sanctioning.
- Frontend-only business rules that differ from the solver.
- Extra product surfaces outside the demo path.

## Done when

The complete five-minute demo path can be performed from the UI using shared sample data.
