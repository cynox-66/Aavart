# Frontend Architecture

## Responsibility

The frontend is a planner review interface. It displays backend truth and must not invent scheduling, safety, or approval decisions.

## Stack

- Next.js
- React
- TypeScript
- Gantt/timeline or equivalent schedule view

## Screens

### 1. Dataset validation

- Upload CSV/JSON.
- Show row-level validation errors.
- Show valid/invalid counts.
- Prevent planning until validation succeeds.

### 2. Planning run

- Show run ID, snapshot ID, ruleset version, solver status, and timestamps.
- Show running, feasible, optimal, infeasible, timeout, invalid, and failed states distinctly.

### 3. Schedule review

- Show section, asset, department, job, window, start, end, status, and reason codes.
- Separate scheduled and unscheduled jobs.
- Make conflicts and rejection reasons readable.

### 4. Lock and re-plan

- Allow a planner to lock an accepted schedule item.
- Show locked items as immutable.
- Show changed and preserved items after re-planning.

### 5. Approval and export

- Show validator result and approval state.
- Disable approval for unsafe or invalid results.
- Disable export until human approval exists.
- Show export metadata: run ID, snapshot ID, ruleset version, reviewer, and timestamp.

## State rules

- Backend status is authoritative.
- Unknown statuses render as an error state, not as success.
- Loading, empty, validation-error, solver-error, and stale-data states are explicit.
- The UI must never show an enabled export button based only on frontend state.

## API boundary

Use the operations and fields in `docs/01_shared_contract.md`. Keep API types separate from visual display labels. Do not rename canonical statuses in the data layer.

## Non-goals

- No frontend-only optimizer.
- No fake live integration status.
- No automatic approval.
- No product surfaces outside the five-minute demo path.
