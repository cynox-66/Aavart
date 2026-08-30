# RailNiyojan Frontend Documentation

Welcome. This folder is the complete handover documentation for the RailNiyojan frontend.

A new frontend engineer should be able to read through these documents in order and begin implementation with minimal external clarification.

---

## What This Documentation Contains

- The product domain, problem, and target user
- The complete application state machine and user flows
- Every screen's purpose, layout, data requirements, and interactions
- The component system and its responsibilities
- The frontend state model (server state vs. UI state vs. local state)
- A full API mapping from every UI action to its backend endpoint, request, response, and state change
- All loading, empty, error, and edge states
- Interaction patterns (confirmations, modals, toasts, polling)
- The emergency RapidBlock workflow in full detail
- The Review Plan screen in full detail
- Responsive behaviour (desktop-first)
- Implementation roadmap and priority order
- Open questions and known gaps

---

## Recommended Reading Order

| Step | Document | Why |
|------|----------|-----|
| 1 | [01-product-overview.md](./01-product-overview.md) | Understand what you are building and for whom |
| 2 | [09-data-models.md](./09-data-models.md) | Understand the data before reading screens |
| 3 | [03-user-flows.md](./03-user-flows.md) | Understand the full user journey |
| 4 | [04-screen-specifications.md](./04-screen-specifications.md) | Understand every screen |
| 5 | [07-backend-integration.md](./07-backend-integration.md) | Understand who is responsible for what |
| 6 | [08-api-mapping.md](./08-api-mapping.md) | Understand every API call |
| 7 | [10-review-plan.md](./10-review-plan.md) | The most important screen, read in full |
| 8 | [11-rapid-blocking.md](./11-rapid-blocking.md) | The emergency workflow |
| 9 | [06-ui-state-model.md](./06-ui-state-model.md) | Understand state management |
| 10 | [05-component-system.md](./05-component-system.md) | Understand the component boundaries |
| 11 | [02-frontend-architecture.md](./02-frontend-architecture.md) | Understand technology and patterns |
| 12 | [12-loading-error-empty-states.md](./12-loading-error-empty-states.md) | Handle edge cases |
| 13 | [13-interaction-patterns.md](./13-interaction-patterns.md) | Understand UX conventions |
| 14 | [15-implementation-roadmap.md](./15-implementation-roadmap.md) | Start building in the right order |
| 15 | [16-open-questions.md](./16-open-questions.md) | Know what is unresolved |

---

## All Documents

| File | Topic |
|------|-------|
| [01-product-overview.md](./01-product-overview.md) | Product, domain, problem, user |
| [02-frontend-architecture.md](./02-frontend-architecture.md) | Tech stack, patterns, state management |
| [03-user-flows.md](./03-user-flows.md) | All user journeys with diagrams |
| [04-screen-specifications.md](./04-screen-specifications.md) | Per-screen specs |
| [05-component-system.md](./05-component-system.md) | Component responsibilities |
| [06-ui-state-model.md](./06-ui-state-model.md) | State machines and state types |
| [07-backend-integration.md](./07-backend-integration.md) | Frontend vs. backend responsibilities |
| [08-api-mapping.md](./08-api-mapping.md) | UI action to API endpoint mapping |
| [09-data-models.md](./09-data-models.md) | All data shapes used by the frontend |
| [10-review-plan.md](./10-review-plan.md) | Detailed Review Plan screen |
| [11-rapid-blocking.md](./11-rapid-blocking.md) | Emergency RapidBlock workflow |
| [12-loading-error-empty-states.md](./12-loading-error-empty-states.md) | All non-happy-path states |
| [13-interaction-patterns.md](./13-interaction-patterns.md) | Buttons, modals, toasts, confirmations |
| [14-responsive-behaviour.md](./14-responsive-behaviour.md) | Layout at different screen sizes |
| [15-implementation-roadmap.md](./15-implementation-roadmap.md) | Build order and dependencies |
| [16-open-questions.md](./16-open-questions.md) | Unresolved items and assumptions |
| [diagrams/application-flow.md](./diagrams/application-flow.md) | Full app state machine |
| [diagrams/plan-lifecycle.md](./diagrams/plan-lifecycle.md) | Plan state transitions |
| [diagrams/review-plan-state-machine.md](./diagrams/review-plan-state-machine.md) | Review Plan interactions |
| [diagrams/rapid-blocking-flow.md](./diagrams/rapid-blocking-flow.md) | RapidBlock workflow |

---

## Key Architectural Facts (Quick Reference)

- **Framework**: Next.js (App Router), React, TypeScript — already established in `apps/web`
- **Backend**: FastAPI at `http://localhost:8000` (configured via `NEXT_PUBLIC_API_URL`)
- **API client**: Already exists at `apps/web/src/lib/api.ts` — do not reinvent it
- **Existing dashboard**: `apps/web/src/app/planner-dashboard.tsx` — a functional prototype, NOT the target design
- **RapidBlock is backend-complete**: `POST /rapidblock-requests` and `GET /rapidblock-requests/{id}` exist and are tested
- **Export is gated**: The backend enforces `export_ready = (approved AND feasible AND validator_passed)`
- **Lock requires replan**: Locking a job does NOT re-optimize automatically. A separate `POST /{run_id}/replan` call is needed.
- **Replan creates a new run**: Replan returns a new `run_id`. The UI must track the latest active run.
