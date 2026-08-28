# Aadi Shah: Research and Data

## Own

- Sample CSV/JSON data.
- Field definitions and realistic assumptions.
- Validation rules backed by the source architecture.
- Tracking assumptions that are not Railway-validated.

## Must implement

- Provide deterministic data that exercises scheduling, conflict, rejection, lock, and re-plan paths.
- Mark assumptions clearly.
- Keep IDs, statuses, timestamps, and relationships internally consistent.
- Record uncertain rules in `docs/04_decision_log.md`.

## Must not implement

- Invented claims that imply operational or legal validity.
- Historical ML performance claims without evidence.
- Real integration credentials or production source dependencies.

## Done when

The shared dataset supports every acceptance scenario and every assumption is documented.
