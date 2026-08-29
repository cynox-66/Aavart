from typing import Any

from fastapi.testclient import TestClient

from railniyojan.api.main import app
from railniyojan.planning.store import planning_store

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


def _create_run(baseline_payload: dict[str, Any]) -> tuple[str, str]:
    validation = client.post("/datasets/validate", json=baseline_payload)
    snapshot_id = validation.json()["snapshot_candidate_id"]
    response = client.post(
        "/planning-runs",
        json={"snapshot_id": snapshot_id, "ruleset_version": "Demo Ruleset v1"},
    )
    assert response.status_code == 201
    return response.json()["run_id"], snapshot_id


def test_unknown_snapshot_is_rejected_with_stable_error() -> None:
    response = client.post(
        "/planning-runs",
        json={"snapshot_id": "SNAP-TEST", "ruleset_version": "Demo Ruleset v1"},
    )

    assert response.status_code == 404
    assert response.json()["code"] == "SNAPSHOT_NOT_FOUND"


def test_planning_run_returns_schedule_and_unscheduled_reasons(
    baseline_payload: dict[str, Any],
) -> None:
    run_id, snapshot_id = _create_run(baseline_payload)

    response = client.get(f"/planning-runs/{run_id}")
    body = response.json()

    assert response.status_code == 200
    assert body["state"] == "OPTIMAL"
    assert body["snapshot_id"] == snapshot_id
    assert body["ruleset_version"] == "Demo Ruleset v1"
    assert body["validator"]["passed"] is True
    assert len(body["schedule_items"]) == 3
    assert body["unscheduled_jobs"] == [
        {"job_id": "JOB-004", "reason_codes": ["TRAIN_PATH_CONFLICT"]}
    ]
    assert {item["job_id"] for item in body["jobs"]} == {
        "JOB-001",
        "JOB-002",
        "JOB-003",
        "JOB-004",
    }
    for index, first in enumerate(body["schedule_items"]):
        for second in body["schedule_items"][index + 1 :]:
            if jobs_share_conflict(first["job_id"], second["job_id"]):
                assert first["end"] <= second["start"] or second["end"] <= first["start"]


def jobs_share_conflict(first_job_id: str, second_job_id: str) -> bool:
    return {first_job_id, second_job_id} == {"JOB-001", "JOB-002"}


def test_planning_is_deterministic(baseline_payload: dict[str, Any]) -> None:
    first_run, snapshot_id = _create_run(baseline_payload)
    second = client.post(
        "/planning-runs",
        json={"snapshot_id": snapshot_id, "ruleset_version": "Demo Ruleset v1"},
    )
    first_detail = client.get(f"/planning-runs/{first_run}").json()
    second_detail = client.get(f"/planning-runs/{second.json()['run_id']}").json()

    assert first_detail["schedule_items"] == second_detail["schedule_items"]
    assert first_detail["unscheduled_jobs"] == second_detail["unscheduled_jobs"]


def test_lock_and_replan_preserve_locked_item(baseline_payload: dict[str, Any]) -> None:
    run_id, _ = _create_run(baseline_payload)
    lock = client.post(
        f"/planning-runs/{run_id}/lock",
        json={"job_id": "JOB-001", "reason": "Planner accepted this block"},
    )
    before = client.get(f"/planning-runs/{run_id}").json()

    replan = client.post(
        f"/planning-runs/{run_id}/replan",
        json={"affected_section_ids": ["SEC-A"], "affected_window_ids": ["WIN-001"]},
    )
    child = client.get(f"/planning-runs/{replan.json()['run_id']}").json()
    before_locked = next(item for item in before["schedule_items"] if item["job_id"] == "JOB-001")
    after_locked = next(item for item in child["schedule_items"] if item["job_id"] == "JOB-001")

    assert lock.status_code == 200
    assert replan.status_code == 201
    assert after_locked == before_locked
    assert child["changes"]["JOB-001"] == "PRESERVED"
    assert child["parent_run_id"] == run_id


def test_export_requires_approval_and_contains_only_approved_run(
    baseline_payload: dict[str, Any],
) -> None:
    run_id, snapshot_id = _create_run(baseline_payload)

    blocked = client.get(f"/planning-runs/{run_id}/export")
    approval = client.post(
        f"/planning-runs/{run_id}/approve",
        json={"reviewer": "akash", "comment": "Reviewed validator and schedule"},
    )
    exported = client.get(f"/planning-runs/{run_id}/export")

    assert blocked.status_code == 409
    assert blocked.json()["code"] == "EXPORT_BLOCKED"
    assert approval.status_code == 200
    assert approval.json()["approval"]["snapshot_id"] == snapshot_id
    assert exported.status_code == 200
    assert exported.headers["content-type"].startswith("text/csv")
    assert run_id in exported.text
    assert "akash" in exported.text


def test_stale_snapshot_blocks_approval_and_export(baseline_payload: dict[str, Any]) -> None:
    run_id, snapshot_id = _create_run(baseline_payload)
    planning_store.set_snapshot_status(snapshot_id, "STALE")

    approval = client.post(
        f"/planning-runs/{run_id}/approve",
        json={"reviewer": "akash", "comment": "Must not be accepted"},
    )
    exported = client.get(f"/planning-runs/{run_id}/export")

    assert approval.status_code == 409
    assert approval.json()["code"] == "STALE_SNAPSHOT"
    assert exported.status_code == 409
    assert exported.json()["code"] == "EXPORT_BLOCKED"


def test_failed_independent_validator_blocks_approval(baseline_payload: dict[str, Any]) -> None:
    run_id, _ = _create_run(baseline_payload)
    run = planning_store.get_run(run_id)
    assert run is not None
    run.validator_passed = False
    run.validator_issues = [{"code": "SAFETY_VALIDATION_FAILED"}]
    planning_store.update_run(run)

    approval = client.post(
        f"/planning-runs/{run_id}/approve",
        json={"reviewer": "akash", "comment": "Must not be accepted"},
    )

    assert approval.status_code == 409
    assert approval.json()["code"] == "SAFETY_VALIDATION_FAILED"
