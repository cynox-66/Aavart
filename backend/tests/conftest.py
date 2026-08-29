import json
from pathlib import Path
from typing import Any

import pytest


@pytest.fixture
def repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


@pytest.fixture
def baseline_payload(repository_root: Path) -> dict[str, Any]:
    fixture_path = repository_root / "fixtures" / "baseline_valid" / "dataset.json"
    return json.loads(fixture_path.read_text())


@pytest.fixture
def baseline_expected_validation(repository_root: Path) -> dict[str, Any]:
    fixture_path = repository_root / "fixtures" / "baseline_valid" / "expected_validation.json"
    return json.loads(fixture_path.read_text())
