# SIH26027 Winning Gap Audit

This is an evidence-based audit of the checkout on 2026-08-31. It is not a progress tracker and it does not convert code presence into product readiness.

## Verdict

The previous biggest failure was real: the mounted UI presented editable planning data while the backend still planned the original baseline fixture. That ingestion/review gap is fixed and browser-tested. The next biggest judge risk is now the still-open P0 safety copy and authority boundary: the product must not imply Railway dispatch authority.

Current honest rating:

- Hackathon demo: 7.5/10 after real mounted ingestion, backend-enforced review intent, honest synchronous planning, real archive reopen, stronger browser coverage, and defensible KPI presentation.
- Product: 3/10. There is still no trusted identity, durable default runtime, operational authority integration, or safety-vetted RapidBlock copy.

The backend has a credible constrained decision-support core. The mounted product now uses that core for selected data and review edits, and it now describes the planning path more honestly. The remaining credibility risk is unsafe authority language and product-hardening gaps.

## Audit evidence

- Backend: 28 tests pass with `UV_CACHE_DIR=/private/tmp/uv-cache backend/.venv/bin/pytest -q backend/tests`.
- Browser coverage: eight Playwright specs pass with `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e`. They cover real upload content, skipped department job-count change, blocked invalid validation, monthly 30-day mode, pending review intent, export blocking, archive reopen, and backend outage handling.
- Frontend typecheck passes with `CI=true pnpm --filter @railniyojan/web typecheck`.
- API surface now has `GET /planning-runs` for archive rows, but still has no snapshot-entities endpoint, upload endpoint, queue/job-status endpoint, or separate monthly-planning endpoint.
- Existing working-tree change: `docs/arnav_handoff.md` is deleted before this audit and was left untouched.

## P0 — must fix before calling this judge-ready

### 1. Mounted ingestion uses selected payloads — fixed 2026-08-30

Fixed evidence:

- `apps/web/src/app/page.tsx:119-135` reads the selected file, stores parsed source payload state, merges loaded departments, and sends the merged payload to backend validation.
- `apps/web/src/lib/ingestion.ts:117-139` reads real JSON/CSV content and retains file name, content type, raw text, parsed payload, row count, warnings, and loaded status.
- `apps/web/src/lib/ingestion.ts:141-219` merges selected TMS/SMMS/TDMS/CIVIL canonical payloads, de-dupes shared entities by ID, applies `WEEKLY` 7-day or `MONTHLY` 30-day date-bounded filtering, removes jobs with no remaining allowed windows, and writes `metadata.source_provenance`, `metadata.horizon`, `metadata.horizon_start`, and `metadata.horizon_end`.
- `apps/web/src/lib/adapters/planning-adapter.ts` no longer substitutes `baselineDatasetFixture` for missing input; null payloads fail visibly.
- `/datasets/validate` now returns `source_hash` and `source_summaries`; the Check Data screen shows backend hash plus source provenance.
- `apps/web/e2e/foundation.spec.ts:55-63` uploads a fixture with unique `JOB-UPLOAD-999`, validates it, creates a run, and asserts the unique job appears in `GET /planning-runs/{run_id}`.
- `apps/web/e2e/foundation.spec.ts:66-73` skips CIVIL and proves the mounted validation job count drops to 3 with `CIVIL: 0 jobs`.

Remaining limit: P0 does not introduce custom TMS/SMMS/TDMS schemas yet. Department files normalize through canonical `DatasetPayload` JSON or the existing entity-column CSV format. Monthly mode is date-bounded filtering with the same CP-SAT solver, not a separate monthly optimizer.

Verification:

- `UV_CACHE_DIR=/private/tmp/uv-cache backend/.venv/bin/pytest -q backend/tests` -> 28 passed.
- `CI=true pnpm --filter @railniyojan/web typecheck` -> passed.
- `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e` -> 8 passed.

### 2. Review edits are backend-enforced planning intent — fixed 2026-08-30

Fixed evidence:

- `backend/src/railniyojan/contracts/api.py` now accepts explicit replan intent: moves, exclusions, lock preservation, actor, reason, and affected scope.
- `backend/src/railniyojan/planning/store.py`, `backend/src/railniyojan/db/models.py`, `backend/src/railniyojan/planning/sql_store.py`, and `backend/migrations/versions/2f6e4a9d1b30_planning_intents.py` add first-class planning-intent persistence for memory and SQL-backed stores.
- `backend/src/railniyojan/api/routes/planning_runs.py:208-303` derives a child snapshot from intent, removes excluded jobs, cleans conflict groups, validates move feasibility, converts accepted moves into fixed schedule items, and records rejected edits with stable reason codes.
- `backend/src/railniyojan/api/routes/planning_runs.py:342-360` replans against the intent-derived snapshot instead of only the original snapshot.
- `apps/web/src/app/page.tsx:223-294` queues move/exclusion intent locally as pending edits, sends exact moves/exclusions/locks to `/replan`, then replaces the displayed plan with the backend child run and clears pending intent only after success.
- `apps/web/e2e/foundation.spec.ts:76-115` moves `JOB-003` to `WIN-003`, excludes `JOB-004`, verifies approval is disabled while intent is pending, follows the child run through `GET /planning-runs/{child_id}`, and asserts lineage, `intent_id`, removed job, and moved schedule item.

Remaining limit: replan remains synchronous through the public `/planning-runs/{run_id}/replan` endpoint. This fixes truthfulness of edits, not the separate worker/queue gap below.

Verification:

- `UV_CACHE_DIR=/private/tmp/uv-cache backend/.venv/bin/pytest -q backend/tests` -> 28 passed, including valid move+exclusion, invalid move rejection, intent persistence, lineage, archive coverage, and KPI assertions.
- `CI=true pnpm --filter @railniyojan/web typecheck` -> passed.
- `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e` -> 8 passed.

### 3. Planning is now honestly scoped as synchronous — fixed 2026-08-31

Fixed evidence:

- `backend/src/railniyojan/api/routes/planning_runs.py:75-126` still executes estimation, CP-SAT, validation, and persistence inside the request path, but the surrounding product now describes that path honestly instead of pretending a queue exists.
- `compose.yaml` no longer starts the sleeping `optimizer` service.
- `docs/architecture.md`, `docs/architecture/backend.md`, `docs/local_development.md`, and `backend/pyproject.toml` now describe a synchronous CP-SAT solve path rather than a worker-backed queue.
- `apps/web/src/components/planning/CreatePlanStep.tsx` now says it is running the synchronous CP-SAT solver on the validated snapshot.

Also removed: `optimizer/worker.py`, the never-assigned `QUEUED` / `RUNNING` members of `PlanningRunState`, and `status_url` (renamed `detail_url`, because it addresses a run that is already complete).

Remaining limit: this is still a synchronous demo path. There is no durable queue, polling, retry, or cancellation contract. `QUEUED` and `RUNNING` return to the enum only alongside a real worker; `docs/architecture.md`, "Execution model", carries the measured cost of synchronous execution and the queued production design.

Verification:

- `UV_CACHE_DIR=/private/tmp/uv-cache backend/.venv/bin/pytest -q backend/tests` -> 28 passed.
- `CI=true pnpm --filter @railniyojan/web typecheck` -> passed.

### 4. Approval and emergency UI copy breaks the safety contract

Evidence:

- `apps/web/src/app/page.tsx:318` says “Official dispatch clearance granted.”
- `apps/web/src/components/rapid-block/CascadeImpactPanel.tsx:127-152` says approval dispatches immediately and requires no further review.
- `apps/web/src/components/rapid-block/CascadeImpactPanel.tsx:158-160` labels the action “Authorize emergency block dispatch.”
- `apps/web/src/components/rapid-block/RapidBlockView.tsx:46-58` approves the child run through the normal plan approval endpoint, then calls it dispatch.
- `docs/security_and_safety.md:5-15` and `docs/project-context/01_shared_contract.md:96-98` explicitly prohibit these claims.

Why this fails: this is a direct contradiction, not a wording preference. It can cause a judge to conclude the product is unsafe or that the team does not understand railway authority boundaries.

Required change:

- Replace “dispatch,” “authorize,” “official clearance,” and “published” with “approve candidate recommendation,” “create revised recommendation,” and “export for operational review.”
- Require the same human approval semantics for RapidBlock as every other candidate.
- Add a copy-level acceptance test that fails on prohibited authority terms in the active UI.

### 5. Browser evidence for the mounted core flow is now materially stronger — fixed 2026-08-31

Fixed evidence:

- `apps/web/e2e/foundation.spec.ts` now has eight mounted-path specs.
- Coverage now includes failed validation blocking, monthly 30-day mode rendering, pending review intent, export blocking before approval, real archive reopen through `GET /planning-runs`, and backend outage handling.
- The suite still runs against the mounted `apps/web/src/app/page.tsx` flow rather than the unused alternate dashboard.

Remaining limit:

- There is still no browser coverage for timeout/degraded solver states or RapidBlock safety copy.
- Browser QA is still local Playwright evidence, not recorded judge-environment evidence.

Verification:

- `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e` -> 8 passed.

## P1 — high-impact gaps after the mounted flow is truthful

### 6. Two frontend implementations create product drift

Evidence: `apps/web/src/app/page.tsx` is the mounted app; `apps/web/src/app/planner-dashboard.tsx` exports an unused alternate dashboard. The two surfaces have different ingestion behavior, controls, copy, and state models.

Impact: fixes made in one surface do not fix the judged product. This is dead code with a high chance of misleading demos and reviewers.

Action: delete the unused surface or make one explicit canonical app. Do not maintain two planning workflows.

### 7. Previous Plans now uses real backend archive data — fixed 2026-08-31

Fixed evidence:

- `backend/src/railniyojan/api/routes/planning_runs.py` exposes `GET /planning-runs`.
- `apps/web/src/components/previous-plans/PreviousPlansList.tsx` loads archive rows through `listPlanningRunsAdapter()`.
- `apps/web/src/app/page.tsx` opens selected archive runs through `fetchPlanningRunAdapter(runId)` and keeps them read-only.
- `apps/web/e2e/foundation.spec.ts` now approves a run, opens Previous Plans, and reopens that real run on the review desk.

Remaining limit: this is still a simple archive list. There is no pagination, retention policy, or reviewer identity trust model yet.

### 8. Reviewer identity is not trustworthy

Evidence:

- `apps/web/src/lib/utils.ts:3-10` defines fixed demo identities.
- `apps/web/src/components/planning/ApprovePlanStep.tsx:31` submits `CURRENT_REVIEWER`.
- `backend/src/railniyojan/api/routes/planning_runs.py:276-300` accepts any non-empty reviewer string; the allowlist is applied only to RapidBlock.

Impact: anyone who can call the API can approve as anyone. For a demo, label it as a simulated actor and make that limitation visible. For a product, add authenticated identity and role authorization before claiming auditability.

### 9. KPI headline now uses closure and coverage instead of fake “downtime savings” — fixed 2026-08-31

Fixed evidence:

- `backend/src/railniyojan/planning/kpis.py` computes both sides of the comparison over the **scheduled jobs only**, so rejecting work can no longer improve the score. Verified: `calculate_kpis(dataset, [])` returned `100.0` and now returns `0.0`.
- It reports `closure_reduction_minutes`, `closure_reduction_percent`, `total_maintenance_minutes`, `scheduled_maintenance_minutes`, `rejected_maintenance_minutes`, `maintenance_coverage_percent`, `rejected_maintenance_percent`, `scheduled_jobs`, `total_jobs`, and `job_coverage_percent`.
- The counterfactual is named: `baseline_method: "SERIAL_PER_SECTION"` with `serial_baseline_closure_minutes`, surfaced in the UI as "one possession per job" rather than an implied human plan.
- Asset downtime is computed against assets instead of being a byte-identical copy of section closure, so it is now a second real measurement rather than a domain error.
- The KPI contract in `backend/src/railniyojan/contracts/api.py` and the frontend mapping in `apps/web/src/lib/adapters/planning-adapter.ts` now carry those fields through end to end.
- `apps/web/src/components/review/PlanImpact.tsx`, `apps/web/src/components/planning/ApprovePlanStep.tsx`, `apps/web/src/components/approved/PlanApprovedScreen.tsx`, and `apps/web/src/components/previous-plans/PreviousPlansList.tsx` render coverage beside every reduction, never a reduction alone.
- `apps/web/src/lib/adapters/planning-adapter.ts` no longer recomputes the headline from minute totals; the backend is the single source of truth.
- `backend/tests/test_kpis.py` pins the adversarial cases as properties: scheduling nothing scores 0%, rejecting a long job never beats scheduling it, and asset downtime differs from section closure when a possession is shared.
- `backend/tests/test_api.py` fixtures were recomputed, not preserved: the old 30.77% "saving" on the baseline fixture was entirely JOB-004's rejection, and now reads 0% with 75% coverage beside it.

Remaining limit: the baseline is a declared serial-stacking counterfactual, not a railway-authorized business KPI, and the solver objective maximises priority-weighted job count with no closure term — closure reduction is a measured outcome, labelled as such. `docs/solver_capacity.md` carries the measured coverage and what the planner cannot fit.

Verification:

- `UV_CACHE_DIR=/private/tmp/uv-cache backend/.venv/bin/pytest -q backend/tests` -> 28 passed.
- `CI=true pnpm --filter @railniyojan/web typecheck` -> passed.

### 10. Monthly mode is now an explicit 30-day filtered mode — fixed 2026-08-31

Fixed evidence:

- `apps/web/src/components/planning/SelectDataStep.tsx` now labels the control `Monthly (30-day filter)` and explains that it reuses the same CP-SAT solver on a 30-day date-bounded snapshot.
- `backend/src/railniyojan/api/validation.py` and `backend/src/railniyojan/api/routes/planning_runs.py` now expose `planning_horizon`, `horizon_start`, and `horizon_end`.
- `apps/web/src/components/review/WeeklyTimelineSummary.tsx` now renders a `30-Day Timeline Overview` when the run was created from monthly mode.
- `apps/web/e2e/foundation.spec.ts` proves a monthly run comes back with `planning_horizon = "MONTHLY"` and renders the 30-day timeline label.

Remaining limit: monthly still means date-bounded filtering with the same solver, not monthly reservations or a separate monthly optimizer.

### 11. Data integration is still controlled-only

Evidence: generated fixtures are under `fixtures/generated`; `docs/mock_data_and_api_reference.md` labels maintenance/authority-style data controlled; RailRadar is a public context adapter and is not coupled to CP-SAT.

This boundary is correct. The gap is the product story: there is no Railway-authorized section mapping, maintenance feed, resource feed, permit/isolation authority, or BDMS integration. Do not claim live integration. Show provenance and freshness per field, and explain the adapter path from TMS/SMMS/TDMS into the canonical snapshot.

### 12. Validation can no longer be locally “fixed” into a solver-ready state — fixed 2026-08-31

Fixed evidence:

- `apps/web/src/components/planning/CheckDataStep.tsx` no longer shows `Auto-Fix All Recommended` or `Mark as Resolved`.
- The Create Plan button now stays blocked until backend validation passes; the screen tells the planner to return to Step 1 and correct the uploaded source.
- `apps/web/src/app/page.tsx` no longer mutates validation state into a fake ready state.
- `apps/web/e2e/foundation.spec.ts` now proves invalid uploaded data remains blocked and cannot advance the solver.

## P2 — important for product credibility, not first demo work

- Default settings use `store_backend = "memory"` (`backend/src/railniyojan/api/settings.py:17`); compose has no checked-in `.env`, so durable Postgres mode is not the default proven path.
- SQL persistence was tested through an in-memory SQLite reconstruction, not a migrated Postgres restart. The current test proves serialization/reload behavior, not deployment durability.
- `CORSMiddleware` allows every origin in `backend/src/railniyojan/api/main.py`; acceptable for a local demo only, not a product posture.
- The API has no pagination, run retention, optimistic concurrency/version checks, or idempotency keys. Double-submit can create duplicate runs/exports.
- `GET /planning-runs/{id}/export` records an export every time it is downloaded; export audit needs request identity, idempotency, and reproducible artifact metadata.
- The planner hardcodes a five-second CP-SAT budget in `backend/src/railniyojan/optimizer/planner.py:134-138` while settings expose another budget. Configuration is not authoritative.
- Reason codes are useful but incomplete: the validator and planner use overlapping names such as `WINDOW_UNAVAILABLE` and `TRAIN_PATH_CONFLICT` without a single catalog or user-facing explanation contract.
- The generated fixtures are visually rich, but synthetic quantities do not establish real performance. Add scenario labels and a reproducible benchmark report rather than more rows.
- README, architecture, tracker, demo script, and UI copy must be checked against the mounted runtime after every feature. The tracker currently says the core demo works end to end while the mounted ingestion and edit paths do not.

## What is genuinely solid

- Canonical Pydantic contracts are strict and reject unknown fields.
- Dataset validation checks schema, duplicates, references, timestamps, and snapshot hashing.
- CP-SAT planning is deterministic for the tested fixture and has an independent post-solve validator.
- Lock preservation, child-run lineage, stale-snapshot blocking, approval gating, and CSV export guards are covered by backend tests.
- RapidBlock backend behavior is candidate-only and retains useful lineage/rejection checks. Its active UI copy currently undermines that safety work.
- The controlled-data boundary is more honest than pretending public timetable data is Railway authorization.

## Build order that has the highest expected judge impact

1. Remove unsafe authority/dispatch copy, especially in RapidBlock and approval messaging.
2. Collapse the duplicate frontend so only the mounted planning path remains.
3. Add browser acceptance tests for timeout/degraded solver states and RapidBlock safety copy.
4. Verify durable Postgres restart behavior and make the persistence mode honest by default.
5. Add trusted identity and role enforcement before claiming reviewer auditability.
6. Keep monthly described as 30-day date-bounded filtering unless a real monthly optimizer is implemented.
7. Add authorized integrations and trained ML only when evidence and authority exist.

## Do not spend time on these yet

- More README pages, more synthetic rows, or more visual polish before P0 acceptance gates pass.
- Calling the deterministic heuristic “AI/ML.” It is explainable assistance with fallback, not trained or validated ML.
- RapidBlock UI polish before the base ingestion/edit/approval flow is truthful.
- A second corridor or Railway-wide topology before one corridor has valid source-to-snapshot lineage.
- Production HA/Kubernetes before the worker contract, persistence mode, and identity model are real.

## Bottom line

The backend is a useful constrained prototype. The active product now drives backend truth for ingestion, review edits, archive reopen, validation gating, monthly scope, and KPI presentation. It is still not judge-proof because its emergency copy violates the safety boundary, reviewer identity is untrusted, and durable production-style runtime proof is still thin.
