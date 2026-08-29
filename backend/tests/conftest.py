import json
from pathlib import Path
from typing import Any

import pytest

from railniyojan.planning.store import planning_store


@pytest.fixture(autouse=True)
def clear_demo_store() -> None:
    planning_store.clear()


@pytest.fixture
def repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


@pytest.fixture
def baseline_payload(repository_root: Path) -> dict[str, Any]:
    fixture_path = repository_root / "fixtures" / "baseline_valid" / "dataset.json"
    payload: dict[str, Any] = json.loads(fixture_path.read_text())
    return payload


@pytest.fixture
def baseline_expected_validation(repository_root: Path) -> dict[str, Any]:
    fixture_path = repository_root / "fixtures" / "baseline_valid" / "expected_validation.json"
    payload: dict[str, Any] = json.loads(fixture_path.read_text())
    return payload
