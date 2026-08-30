# 02 — Frontend Architecture

## Established Technology Stack

The frontend is **already bootstrapped**. Do not change the framework.

| Layer | Technology | Location |
|-------|-----------|----------|
| Framework | Next.js (App Router) | `apps/web/` |
| Language | TypeScript | `apps/web/src/` |
| UI library | React | — |
| Styling | CSS (global, existing in `globals.css`) | `apps/web/src/app/globals.css` |
| API client | Custom fetch wrapper | `apps/web/src/lib/api.ts` |
| Type schema | Generated from OpenAPI | `apps/web/src/lib/api-schema.ts` |
| Package manager | pnpm (workspace) | Root `pnpm-workspace.yaml` |
| Test runner | Vitest (unit) + Playwright (E2E) | `apps/web/vitest.config.ts`, `apps/web/playwright.config.ts` |
| Build | Next.js (`next build`) | — |

**Backend**: FastAPI at `http://localhost:8000` (env: `NEXT_PUBLIC_API_URL`).

---

## Current Frontend State (What Exists)

The file `apps/web/src/app/planner-dashboard.tsx` is a **functional prototype** that already wires all backend API calls. It is NOT the target polished UI but contains working implementations of:

- Dataset upload and validation
- Planning run creation
- Job selection and inspection
- Lock action
- Replan action
- Approve action
- Export/download
- RapidBlock drawer (structural)

The new target UI should replace this prototype's layout and design while reusing the API client (`api.ts`) and the existing TypeScript types.

---

## Page and Screen Organization

The application is a **Single Page Application (SPA)**. Navigation between states is done through React state management, not URL routing (except possibly for deep-linking to specific plans).

Recommended page structure:

```
/                   → Home / Welcome screen
/plans              → View Previous Plans list
/plan/new           → 5-step wizard (Select Data → Approve Plan)
/plan/:run_id       → View/Edit a specific plan (Review Plan)
/emergency          → Emergency Rapid-Block Mode
```

> **ASSUMPTION**: The routing strategy above is not yet implemented. The current prototype renders everything in a single page. The new UI should implement proper routing.

---

## Component Boundaries

Group components by feature, not by type:

```
src/
├── app/                        # Next.js pages
│   ├── page.tsx                # Home screen
│   ├── plan/
│   │   ├── new/page.tsx        # 5-step wizard
│   │   └── [run_id]/page.tsx   # Review Plan
│   ├── plans/page.tsx          # Previous Plans list
│   └── emergency/page.tsx      # RapidBlock Mode
├── features/
│   ├── dataset/                # Data upload, validation
│   ├── planning/               # Plan creation, status
│   ├── review/                 # Review Plan screen
│   │   ├── CorridorOverview/
│   │   ├── WeeklyTimeline/
│   │   ├── PlanImpact/
│   │   ├── JobInspector/
│   │   └── GlobalPlanStatus/
│   ├── approval/               # Approve + export
│   └── emergency/              # RapidBlock workflow
├── components/                 # Shared UI primitives
│   ├── WorkflowStepper/
│   ├── StatusBadge/
│   ├── ConfirmModal/
│   └── Toast/
└── lib/
    ├── api.ts                  # Existing API client (do not modify contract)
    └── api-schema.ts           # Existing generated types
```

---

## State Management Strategy

### Three Layers of State

**1. Server State** (backend truth — use a server state library)

These values come from the API and must never be invented by the frontend:

- Current planning run details (`RunDetail`)
- Validation result (`ValidationResponse`)
- RapidBlock result (`RapidBlockDetail`)
- KPIs, reason codes, schedule items, approval status

**Recommended approach**: Use **TanStack Query (React Query)** for server state. This gives you caching, loading states, error states, and background refetching out of the box.

> **ASSUMPTION**: React Query is not yet installed. It needs to be added.

**2. UI State** (React local state, `useState`)

These are transient UI decisions that do not need to survive a page refresh:

- Which job is currently selected (`selectedJobId`)
- Whether the Inspector drawer is open
- Whether the expanded timeline modal is open
- Which validation issue is expanded
- Toast notification queue

**3. Local Workflow State** (wizard step, dirty flags)

- Current wizard step (1–5)
- Whether the plan has "unsaved constraints" (jobs locked but not yet replanned)
- `busyAction` — which API call is currently in flight

---

## API / Service Layer

All API calls are already abstracted in `apps/web/src/lib/api.ts`. 

**Rule**: The frontend must never construct raw `fetch` calls outside of `api.ts`. If a new API call is needed, add it to `api.ts`.

The API base URL is configured via the environment variable:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Server State vs. UI State (Critical Rule)

> The UI must render backend values directly. It must never invent, derive, or recalculate KPIs, plan states, or scheduling decisions.

| Data Point | Source | What Frontend Should Do |
|-----------|--------|------------------------|
| `run.state` (OPTIMAL/FEASIBLE) | Backend | Display directly |
| `run.kpis.downtime_reduction_percent` | Backend | Display directly, format to 1 decimal |
| `schedule_item.locked` | Backend | Use to render lock icon |
| `run.approval` | Backend | Use `approval !== null` to show approved state |
| `run.export_ready` | Backend | Use to enable/disable Export button |
| `run.validator.passed` | Backend | Use to gate Approve button |
| "Why This Time?" reason codes | Backend (`schedule_item.reason_codes`, `ai_estimates`) | Display as list |

---

## Real-Time and Polling Considerations

The current backend runs the optimizer **synchronously** within the API request. When `POST /planning-runs` or `POST /planning-runs/{id}/replan` returns, the run is already complete.

**Implication**: There is no need for WebSocket or polling for the standard planning flow. The loading state is simply the in-flight HTTP request.

**Future consideration**: If the backend moves to an async worker model, `GET /planning-runs/{run_id}` would need to be polled until `state` leaves `QUEUED` or `RUNNING`. Document this assumption: See [16-open-questions.md](./16-open-questions.md).

---

## Caching Considerations

- After a `POST /planning-runs/{id}/lock`, the frontend calls `GET /planning-runs/{id}` to get the updated run. The response should update the cache.
- After a `POST /planning-runs/{id}/replan`, the returned `run_id` is a **new run**. The frontend must load this new run_id.
- After `POST /planning-runs/{id}/approve`, the frontend should invalidate and refetch the run to show the approved state.
