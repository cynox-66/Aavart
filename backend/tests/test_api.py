from typing import Any

from fastapi.testclient import TestClient

from railniyojan.api.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_fixture_validation_endpoint(baseline_payload: dict[str, Any]) -> None:
    response = client.post("/datasets/validate", json=baseline_payload)

    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert response.json()["counts"]["jobs"] == 4


def test_planning_route_is_explicitly_unimplemented() -> None:
    response = client.post(
        "/planning-runs",
        json={"snapshot_id": "SNAP-TEST", "ruleset_version": "Demo Ruleset v1"},
    )

    assert response.status_code == 501
    assert response.json()["code"] == "FOUNDATION_NOT_IMPLEMENTED"

