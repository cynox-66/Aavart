# SIH26027 Winning Gap Checklist

This file is blunt on purpose.

It does **not** claim the project is already winning.
It lists what is still missing from this repo if the goal is to have a real shot at winning SIH26027.

## First truth

The repo currently has a strong backend slice and a lot of documentation.
That is not the same as a judge-ready, winning prototype.

If the judge cannot open the system and understand the gain in under a minute, it is not winning.

## What SIH26027 actually rewards

The problem statement is about:

- coordinating maintenance across the three departments;
- using corridor availability from timetable-like supply data;
- producing weekly and monthly planning views;
- proving that the optimizer saves asset downtime versus a baseline;
- showing a clear, measurable improvement, not just a pretty schedule.

## What is missing from this repo

### 1. A judge-proof end-to-end UI

The frontend must reliably do all of this in the browser:

- upload a dataset;
- validate it;
- create a run;
- show the schedule and unscheduled reasons;
- lock one item;
- re-plan;
- approve;
- export.

Right now the repo says this exists, but if the UI breaks or is incomplete in practice, the project is not demo-ready.

### 2. A real winning story, not just a working schedule

The backend now exposes a before/after comparison. Arnav still needs to decide whether to show it in the UI.

Implemented backend pieces:

- baseline vs optimized section closure hours;
- baseline vs optimized asset downtime;
- a clear numeric improvement;
- a simple explanation of why the optimizer is better than manual department-by-department planning.

Remaining risk: if the UI or presentation does not show these numbers, the judge still sees a scheduler, not a winner.

### 3. The AI layer, if you insist on making it real

The repo now has a local heuristic AI estimate step with deterministic fallback evidence.

Implemented backend pieces:

- a local heuristic model wrapper;
- a defined input/output contract for AI-assisted priority or duration estimates;
- deterministic fallback when ML fails;
- integration into the solver or data pipeline.

Still missing: evidence that AI helps instead of hurting. Do not claim validated ML superiority.

### 4. Durable persistence

Default tests still use process-local state, but the backend now has a SQL-backed store path.

Implemented backend pieces:

- persistence that survives restart;
- stored snapshots;
- stored runs;
- stored approvals;
- stored exports;
- stored audit trail.

Remaining risk: durable demo mode requires `STORE_BACKEND=sql`, migrated Postgres, and operational verification in the actual demo environment.

### 5. The monthly planning side of SIH26027

The repo is scoped to weekly planning only.
The statement mentions both weekly and monthly horizon plans.

Missing pieces:

- monthly horizon planning;
- monthly summaries;
- a way to compare weekly and monthly views;
- a reason for why the monthly view matters.

This is not a blocker for a narrow hackathon slice, but it is a gap against the full statement.

### 6. Realistic data story

The repo uses controlled sample data.
That is fine for a demo, but it is not enough to look serious to judges unless you explain it well.

Missing pieces:

- a clear synthetic-data generation story;
- a baseline that resembles real maintenance demand;
- explanation of how timetable / corridor availability was approximated;
- a visible warning that internal railway systems are not being claimed as integrated.

### 7. RapidBlock backend is implemented; UI is still unfinished

The docs treat RapidBlock as optional.
The backend now implements the guarded extension; the UI path is still Arnav-owned.

Implemented backend pieces:

- authorized urgent-job submission;
- derived snapshot creation;
- child run lineage;
- candidate-ready comparison;
- lock-preservation proof;
- rejection paths for unauthorized actor, no eligible window, and outside scope.

Remaining risk: no judge-facing UI surface yet.

### 8. Contract consistency

The repo currently has too many places saying “done” when the practical system is not done.

Partly addressed:

- one honest status source;
- a tracker that matches runtime reality;
- a decision log entry for any scope change;
- acceptance checks that reflect what is actually implemented;
- no fake “done” labels for unfinished pieces.

### 9. Judge presentation assets

Even a working system can lose if the presentation is weak.

Missing pieces:

- a 60–90 second judge script;
- screenshots or a recorded walkthrough;
- one slide showing baseline vs optimized metrics;
- one slide showing why the solution is hard to copy;
- one slide explaining the exact scope boundaries.

### 10. Hard validation evidence

The repo needs proof, not claims.

Implemented backend evidence:

- repeatable backend tests;
- evidence that invalid data is rejected;
- evidence that export is blocked until approval;
- evidence that lock and re-plan preserve the locked item.

Still needed outside Akash's non-UI scope:

- repeatable UI tests for the new KPI/RapidBlock surfaces;
- end-to-end browser validation after Arnav wires the UI.

## What should be built next, in order

1. Make the browser flow actually work end to end.
2. Show the asset-downtime comparison in the UI/presentation.
3. Run durable demo mode against migrated Postgres before relying on restart safety.
4. Keep AI wording limited to local heuristic assistance with fallback.
5. Wire RapidBlock in UI only if the core browser flow stays stable.
6. Add monthly planning only if you want closer SIH26027 coverage.

## What will not make you win

- a bigger README;
- more tracker optimism;
- AI words without a model or service;
- a solver that works but cannot be shown;
- RapidBlock before the core flow is solid;
- pretending weekly-only planning fully satisfies the statement.

## Bottom line

The repo is closer to a constrained prototype than a winning SIH26027 submission.
To become competitive, it needs:

- a working browser flow;
- measurable asset-downtime savings;
- honest persistence;
- a real answer on AI;
- proof, not just documentation.
