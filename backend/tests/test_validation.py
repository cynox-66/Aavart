from copy import deepcopy
from typing import Any

from railniyojan.api.validation import validate_dataset


def test_baseline_fixture_is_valid(
    baseline_payload: dict[str, Any], baseline_expected_validation: dict[str, Any]
) -> None:
    result = validate_dataset(baseline_payload)

    assert result.model_dump(mode="json") == baseline_expected_validation


def test_snapshot_candidate_is_deterministic(baseline_payload: dict[str, Any]) -> None:
    first = validate_dataset(baseline_payload)
    second = validate_dataset(deepcopy(baseline_payload))

    assert first.snapshot_candidate_id == second.snapshot_candidate_id


def test_unknown_resource_returns_row_level_error(baseline_payload: dict[str, Any]) -> None:
    payload = deepcopy(baseline_payload)
    payload["jobs"][0]["required_resources"] = ["MISSING_TEAM"]

    result = validate_dataset(payload)

    assert result.valid is False
    assert result.snapshot_candidate_id is None
    assert any(issue.field == "jobs.0.required_resources" for issue in result.errors)
    assert any(issue.row == 1 for issue in result.errors)


def test_duplicate_job_is_rejected(baseline_payload: dict[str, Any]) -> None:
    payload = deepcopy(baseline_payload)
    payload["jobs"].append(deepcopy(payload["jobs"][0]))

    result = validate_dataset(payload)

    assert result.valid is False
    assert any("duplicate jobs identifier" in issue.message for issue in result.errors)
