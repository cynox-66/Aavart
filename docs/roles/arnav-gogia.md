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
- Show the optional RapidBlock request state, parent/child lineage, preserved locks, and candidate comparison using backend truth.

## Must not implement

- Fake success states disconnected from backend results.
- A UI that implies automatic sanctioning.
- Frontend-only business rules that differ from the solver.
- Extra product surfaces outside the core demo path and approved optional RapidBlock extension.

## Done when

The complete five-minute core demo and optional 60-90 second RapidBlock extension can be performed from the UI using shared sample data.
