# Generated corridor fixtures

Run `backend/.venv/bin/python backend/scripts/generate_demo_datasets.py` from the
repository root to regenerate these deterministic fixtures.

The fixtures contain two independent corridors. Each corridor has a canonical
`dataset.json` accepted by the current API validator, plus station, isolation,
block-rule, and permit records used by the richer visualisation layer.

All records are `CONTROLLED-SCENARIO` except train-path provenance, which is
marked `PUBLIC` with `RailRadar` as the provider. The route-to-section mapping
is still synthetic and must not be presented as Railway-authorized.

The planner scope remains one corridor per run. `catalog.json` is for corridor
selection and comparison; it is not a multi-corridor planning snapshot.
