"""Guards that the solver's configured knobs are not decorative.

`solver_time_budget_seconds` was declared in settings while the planner hardcoded
`max_time_in_seconds = 5.0`, and `deterministic_seed` was declared while the route
passed the literal 26027. Both are the backend twin of the removed "Monthly
(Macro)" toggle: a control that advertises a behaviour it does not have. These
tests fail if either is ever unhooked again.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from ortools.sat.python import cp_model

from railniyojan.api.main import app
from railniyojan.api.routes import planning_runs
from railniyojan.api.settings import Settings, get_settings
from railniyojan.contracts.models import DatasetPayload
from railniyojan.optimizer.contracts import OptimizerInput
from railniyojan.optimizer.planner import DeterministicPlanner


@pytest.fixture
def dataset(repository_root: Path) -> DatasetPayload:
    payload: dict[str, Any] = json.loads(
        (repository_root / "fixtures" / "baseline_valid" / "dataset.json").read_text()
    )
    return DatasetPayload(**payload)


def _input(dataset: DatasetPayload, **overrides: Any) -> OptimizerInput:
    base: dict[str, Any] = {
        "run_id": "RUN-TEST",
        "snapshot_id": "SNAP-TEST",
        "ruleset_version": "Demo Ruleset v1",
        "deterministic_seed": 26027,
        "time_budget_seconds": 10,
        "dataset": dataset,
    }
    return OptimizerInput(**{**base, **overrides})


def test_planner_applies_the_time_budget_it_is_given(
    dataset: DatasetPayload, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[float] = []
    original = cp_model.CpSolver.solve

    def record(self: cp_model.CpSolver, model: cp_model.CpModel) -> Any:
        seen.append(self.parameters.max_time_in_seconds)
        return original(self, model)

    monkeypatch.setattr(cp_model.CpSolver, "solve", record)

    DeterministicPlanner().solve(_input(dataset, time_budget_seconds=1.5))
    DeterministicPlanner().solve(_input(dataset, time_budget_seconds=7))

    assert seen == [1.5, 7.0]


def test_planner_applies_the_seed_it_is_given(
    dataset: DatasetPayload, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[int] = []
    original = cp_model.CpSolver.solve

    def record(self: cp_model.CpSolver, model: cp_model.CpModel) -> Any:
        seen.append(self.parameters.random_seed)
        return original(self, model)

    monkeypatch.setattr(cp_model.CpSolver, "solve", record)

    DeterministicPlanner().solve(_input(dataset, deterministic_seed=4242))

    assert seen == [4242]


def test_a_run_uses_the_configured_budget_and_seed_not_a_literal(
    baseline_payload: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    """End to end: change the settings, and the solver call must change with them."""
    captured: list[OptimizerInput] = []
    real_solve = planning_runs.planner.solve

    def capture(planner_input: OptimizerInput) -> Any:
        captured.append(planner_input)
        return real_solve(planner_input)

    monkeypatch.setattr(planning_runs.planner, "solve", capture)
    monkeypatch.setattr(
        planning_runs,
        "get_settings",
        lambda: Settings(solver_time_budget_seconds=3, deterministic_seed=99),
    )

    client = TestClient(app)
    validation = client.post("/datasets/validate", json=baseline_payload)
    created = client.post(
        "/planning-runs",
        json={
            "snapshot_id": validation.json()["snapshot_candidate_id"],
            "ruleset_version": "Demo Ruleset v1",
        },
    )

    assert created.status_code == 201
    assert [(item.time_budget_seconds, item.deterministic_seed) for item in captured] == [(3.0, 99)]


def test_settings_defaults_are_the_values_the_solver_actually_runs_with() -> None:
    settings = get_settings()

    assert settings.solver_time_budget_seconds > 0
    assert settings.deterministic_seed == 26027
