# Development Handoff

Merge the foundation branch before feature branches begin. Documentation is authoritative for behavior; executable contracts are authoritative for field names and types.

## Shared boundaries

- Do not edit `apps/web/src/lib/api-schema.ts` manually. Change the FastAPI/Pydantic contract, record any required contract decision, then run `make openapi`.
- Do not create private fixture formats. Every feature test starts from a committed scenario under `fixtures/`.
- Do not return fake successful planning states. Unimplemented routes remain explicit failures until their acceptance checks pass.
- Do not implement RapidBlock before the mandatory core planning flow works.
- Do not change database schema without an Alembic migration.

## Parallel start points

| Owner | Start path | First deliverable |
|---|---|---|
| Akash | `backend/src/railniyojan/api`, `backend/src/railniyojan/db` | Persist validated snapshots and create queued planning runs |
| Dev Jaiswal | `backend/src/railniyojan/optimizer` | CP-SAT implementation of `Planner` using `OptimizerInput` and `OptimizerOutput` |
| Arnav Gogia | `apps/web` | Dataset upload and row-level validation screen using generated API types |
| Aadi Shah | `fixtures` | Invalid-input and conflict scenarios with expected outcomes |
| Mohit Ray | `apps/web` design assets | Schedule-review visual system using canonical statuses |
| Sakshi Raghuwanshi | `docs/demo_script.md` and deck | Story synchronized with implemented acceptance checks |

## Handoff gate

Before requesting integration, run:

```bash
make lint
make typecheck
make test
```

Use the handoff format in `docs/project-context/05_integration_rules.md` and list any unimplemented dependency explicitly.
