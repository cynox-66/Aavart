# SIH26027 Winning Gap Audit

This is an evidence-based audit of the checkout on 2026-08-30. It is not a progress tracker and it does not convert code presence into product readiness.

## Verdict

The previous biggest failure was real: the mounted UI presented editable planning data while the backend still planned the original baseline fixture. That P0 ingestion/review gap is now fixed and browser-tested. The biggest remaining judge risk is the still-open P0 safety/worker/browser-coverage story: the product must not imply Railway dispatch authority, and the architecture still overstates asynchronous worker behavior.

Current honest rating:

- Hackathon demo: 6.5/10 after real mounted ingestion, backend-enforced review intent, and browser acceptance tests for those flows.
- Product: 2.5/10. There is still no identity, durable default runtime, asynchronous worker, run history, or operational authority integration.

The backend has a credible constrained decision-support core. The mounted product now uses that core for selected data and review edits, but still overstates authority/worker behavior in other areas.

## Audit evidence

- Backend: 27 tests pass with `backend/.venv/bin/pytest -q backend/tests`.
- Browser coverage: four Playwright specs pass with `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e`. They now cover real upload content, skipped department job-count change, pending review intent, and backend child-run assertions.
- Frontend typecheck passes with `CI=true pnpm --filter @railniyojan/web typecheck`.
- API surface has no list-runs endpoint, snapshot-entities endpoint, upload endpoint, queue/job-status endpoint, or monthly-planning endpoint.
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

- `backend/.venv/bin/pytest -q backend/tests` -> 27 passed.
- `CI=true pnpm --filter @railniyojan/web typecheck` -> passed.
- `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e` -> 4 passed.

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

- `backend/.venv/bin/pytest -q backend/tests` -> 27 passed, including valid move+exclusion, invalid move rejection, intent persistence, lineage, and audit coverage.
- `CI=true pnpm --filter @railniyojan/web typecheck` -> passed.
- `CI=true PORT=3001 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 pnpm --filter @railniyojan/web test:e2e` -> 4 passed.

### 3. The “worker” is a sleeping process and planning is synchronous

Evidence:

- `backend/src/railniyojan/optimizer/worker.py:8-11` logs “queue execution is not implemented” and sleeps forever.
- `backend/src/railniyojan/api/routes/planning_runs.py:75-126` executes estimation, CP-SAT, validation, and persistence inside the request path.
- `compose.yaml:34-45` starts the sleeping worker anyway.
- `backend/src/railniyojan/contracts/api.py:42-49` returns a completed run state even though the architecture documents `QUEUED -> RUNNING -> ...`.

Why this fails: the architecture and UI imply background execution, cancellation, status polling, and resilience that do not exist. A slow or concurrent run will block the API and a worker restart proves nothing.

Required change:

- Either remove worker claims and explicitly scope the demo to synchronous planning, or implement a real durable queue with claimed jobs, retries, terminal failure, idempotency, and status polling.
- The API must return `QUEUED`/`RUNNING` before solving if the worker path is retained.
- Add a browser test for polling, timeout, failed job, and retry behavior.

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

### 5. Browser evidence is far too weak

Evidence:

- `apps/web/e2e/foundation.spec.ts` now covers the fixed P0 ingestion and review-intent gates: unique uploaded job reaches `GET /planning-runs/{run_id}`, skipped department changes mounted validation count, pending edits block approval, and replan returns a backend child run.
- There are still no browser tests for failed validation, infeasible run, timeout/degraded run, backend outage, refresh/reopen, export blocking, or RapidBlock safety copy.
- Browser QA remains local Playwright evidence, not a recorded judge-environment run.

Required change:

- Make the real mounted page the only tested product surface.
- Add tests for invalid input, infeasible run, timeout/degraded run, backend outage, refresh/reopen, and export blocking.
- Record actual browser QA separately from unit/API test results.

## P1 — high-impact gaps after the mounted flow is truthful

### 6. Two frontend implementations create product drift

Evidence: `apps/web/src/app/page.tsx` is the mounted app; `apps/web/src/app/planner-dashboard.tsx` exports an unused alternate dashboard. The two surfaces have different ingestion behavior, controls, copy, and state models.

Impact: fixes made in one surface do not fix the judged product. This is dead code with a high chance of misleading demos and reviewers.

Action: delete the unused surface or make one explicit canonical app. Do not maintain two planning workflows.

### 7. Previous Plans are fabricated history

Evidence:

- `apps/web/src/app/page.tsx:356-377` loads `demoHistoricalPlan` with hardcoded approval data.
- `apps/web/src/components/previous-plans/PreviousPlansList.tsx` reads `mockPreviousPlans`.
- The API has no run-list/history endpoint.

The banner is honest, but the feature still occupies product real estate as if history exists. Either implement `GET /planning-runs` with persisted filters and reopen behavior, or remove the feature from the judge path. Never show fake approved runs as product history.

### 8. Reviewer identity is not trustworthy

Evidence:

- `apps/web/src/lib/utils.ts:3-10` defines fixed demo identities.
- `apps/web/src/components/planning/ApprovePlanStep.tsx:31` submits `CURRENT_REVIEWER`.
- `backend/src/railniyojan/api/routes/planning_runs.py:276-300` accepts any non-empty reviewer string; the allowlist is applied only to RapidBlock.

Impact: anyone who can call the API can approve as anyone. For a demo, label it as a simulated actor and make that limitation visible. For a product, add authenticated identity and role authorization before claiming auditability.

### 9. KPI “downtime savings” is not a defensible business metric

Evidence:

- `backend/src/railniyojan/planning/kpis.py:36-80` builds the baseline by serially stacking jobs by section and sets asset downtime equal to section closure time.
- It computes optimized closure only from scheduled items, while rejected jobs disappear from the optimized numerator.
- `backend/src/railniyojan/optimizer/planner.py:127-133` maximizes priority-weighted scheduled jobs, not the reported downtime metric.
- Current test result is 390 baseline minutes vs 270 optimized minutes and 120 minutes “saved” for the four-job fixture (`backend/tests/test_api.py:68-71`).

Why this fails: the number can improve because work is rejected, and “asset downtime” is just a closure proxy. It is not evidence of operational savings.

Required change:

- Define baseline algorithm and optimized objective in domain terms.
- Track asset occupancy separately from section possession and count rejected work explicitly.
- Report scheduled maintenance coverage, rejected minutes, closure minutes, asset downtime, and service-level constraints together.
- Add adversarial fixtures where rejecting jobs cannot improve the headline score.
- Present confidence and controlled-scenario labels beside every KPI.

### 10. Monthly mode is a dead toggle

Evidence: `apps/web/src/components/planning/SelectDataStep.tsx:23-67` changes local state only; all rendered planning output is `WeeklyTimelineSummary`, and there is no monthly API contract.

Action: either implement monthly capacity reservations, summaries, and a weekly-to-monthly relationship, or remove/disable the toggle and state that the submission is weekly-only. A dead SIH requirement control is worse than an explicit scope boundary.

### 11. Data integration is still controlled-only

Evidence: generated fixtures are under `fixtures/generated`; `docs/mock_data_and_api_reference.md` labels maintenance/authority-style data controlled; RailRadar is a public context adapter and is not coupled to CP-SAT.

This boundary is correct. The gap is the product story: there is no Railway-authorized section mapping, maintenance feed, resource feed, permit/isolation authority, or BDMS integration. Do not claim live integration. Show provenance and freshness per field, and explain the adapter path from TMS/SMMS/TDMS into the canonical snapshot.

### 12. Validation “auto-fix” is not a fix

Evidence: `apps/web/src/app/page.tsx:154-164` marks issues resolved locally, while `backend/src/railniyojan/api/validation.py:214-226` only registers a snapshot when the original payload is valid.

Impact: the UI can display a resolved/ready state without changing the candidate payload. Replace the action with a real transformation that is revalidated, or rename it to “acknowledge for review” and keep planning blocked until backend validation passes.

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

1. Remove unsafe authority/dispatch copy and collapse the duplicate frontend.
2. Add browser acceptance tests for invalid/failure/reopen/export/RapidBlock paths and run them against the actual demo environment.
3. Repair KPI definitions and show coverage plus savings, not a single flattering percentage.
4. Choose honestly between a synchronous demo and a real worker; do not keep a sleeping worker container.
5. Implement real run history and durable Postgres verification.
6. Keep monthly described as 30-day date-bounded filtering unless a real monthly optimizer is implemented.
7. Add authorized integrations and trained ML only when evidence and authority exist.

## Do not spend time on these yet

- More README pages, more synthetic rows, or more visual polish before P0 acceptance gates pass.
- Calling the deterministic heuristic “AI/ML.” It is explainable assistance with fallback, not trained or validated ML.
- RapidBlock UI polish before the base ingestion/edit/approval flow is truthful.
- A second corridor or Railway-wide topology before one corridor has valid source-to-snapshot lineage.
- Production HA/Kubernetes before the worker contract, persistence mode, and identity model are real.

## Bottom line

The backend is a useful constrained prototype. The active product is not yet judge-proof because its most visible controls do not drive backend truth, its worker claim is false, its KPI claim is weakly grounded, and its emergency copy violates the safety boundary. Fix those before adding scope.
