"""Measures what synchronous planning actually costs, as a baseline for Phase 5.

The dossier claimed a solve makes "the entire API unresponsive". It does not.
`create_planning_run` and `create_rapidblock_request` are `def`, not `async def`,
so FastAPI runs them in anyio's worker threadpool and the event loop stays free;
CP-SAT also releases the GIL while solving. A judge who curls /health mid-solve
gets a fast 200.

That is worth pinning, because it is the difference between "we must ship a queue
before the demo" and "a queue buys concurrent throughput a single-operator demo
never exercises". These tests state the real limit - the threadpool width - rather
than a limit nobody measured.
"""

from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from railniyojan.api.main import app
from railniyojan.api.routes import planning_runs
from railniyojan.optimizer.contracts import OptimizerInput, OptimizerOutput

SOLVE_SECONDS = 1.5
TERMINAL_STATES = {"OPTIMAL", "FEASIBLE", "INFEASIBLE", "TIMEOUT", "INVALID", "FAILED"}


@pytest.fixture
def slow_solver(monkeypatch: pytest.MonkeyPatch) -> None:
    """Stretch the solve so concurrent behaviour is observable.

    time.sleep is the right stand-in: like CP-SAT's solve loop it blocks the
    worker thread without yielding to the event loop, so if the endpoint were
    `async def` this would freeze the API - which is exactly what we are testing
    it does not do.
    """
    real = planning_runs.planner.solve

    def slow(planner_input: OptimizerInput) -> OptimizerOutput:
        time.sleep(SOLVE_SECONDS)
        return real(planner_input)

    monkeypatch.setattr(planning_runs.planner, "solve", slow)


@pytest.fixture
def snapshot_id(repository_root: Path) -> str:
    payload: dict[str, Any] = json.loads(
        (repository_root / "fixtures" / "baseline_valid" / "dataset.json").read_text()
    )
    # ASGITransport is async-only, so seed the snapshot through the sync client.
    client = TestClient(app)
    return str(client.post("/datasets/validate", json=payload).json()["snapshot_candidate_id"])


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")


@pytest.mark.anyio
async def test_health_answers_promptly_while_a_run_is_solving(
    slow_solver: None, snapshot_id: str
) -> None:
    """The event loop stays free during a solve, so /health is not queued behind it.

    The probe is timed from before the run is dispatched, not from a sleep after
    it. A blocked event loop cannot run `asyncio.sleep` either, so timing from a
    sleep would silently measure the moment *after* the block cleared and pass
    against an `async def` endpoint that does freeze the API.
    """
    async with _client() as client:
        started = time.perf_counter()
        health_latency: list[float] = []

        async def probe() -> httpx.Response:
            response = await client.get("/health", timeout=10)
            health_latency.append(time.perf_counter() - started)
            return response

        run, health = await asyncio.gather(
            client.post(
                "/planning-runs",
                json={"snapshot_id": snapshot_id, "ruleset_version": "Demo Ruleset v1"},
                timeout=30,
            ),
            probe(),
        )

        assert health.status_code == 200
        assert health.json()["status"] == "ok"
        assert run.status_code == 201
        # Answered while the solve was still running, not after it finished.
        assert health_latency[0] < SOLVE_SECONDS / 2, (
            f"/health took {health_latency[0]:.2f}s during a {SOLVE_SECONDS}s solve"
        )


@pytest.mark.anyio
async def test_two_runs_overlap_rather_than_running_end_to_end(
    slow_solver: None, snapshot_id: str
) -> None:
    """Throughput is bounded by the threadpool and cores, not serialised to one."""
    async with _client() as client:
        body = {"snapshot_id": snapshot_id, "ruleset_version": "Demo Ruleset v1"}

        started = time.perf_counter()
        first, second = await asyncio.gather(
            client.post("/planning-runs", json=body, timeout=30),
            client.post("/planning-runs", json=body, timeout=30),
        )
        elapsed = time.perf_counter() - started

        assert first.status_code == 201
        assert second.status_code == 201
        assert first.json()["run_id"] != second.json()["run_id"]
        # Serial execution would take 2 x SOLVE_SECONDS.
        assert elapsed < SOLVE_SECONDS * 1.8, f"two runs took {elapsed:.2f}s, i.e. serialised"


@pytest.mark.anyio
async def test_a_run_created_during_another_solve_is_still_readable(
    slow_solver: None, snapshot_id: str
) -> None:
    """No half-written run is observable: a run appears complete or not at all."""
    async with _client() as client:
        run = asyncio.create_task(
            client.post(
                "/planning-runs",
                json={"snapshot_id": snapshot_id, "ruleset_version": "Demo Ruleset v1"},
                timeout=30,
            )
        )
        await asyncio.sleep(0.3)

        listed = await client.get("/planning-runs", timeout=5)
        assert listed.status_code == 200
        # The in-flight run is not published mid-solve - it is stored once, at
        # the end - so every listed run is in a terminal state. This is why
        # PlanningRunState no longer carries QUEUED or RUNNING: there is no
        # moment at which either could be observed.
        assert all(
            summary["state"] in TERMINAL_STATES for summary in listed.json()
        )

        created = await run
        detail = await client.get(f"/planning-runs/{created.json()['run_id']}", timeout=5)
        assert detail.status_code == 200
        assert detail.json()["state"] in {"OPTIMAL", "FEASIBLE"}


def test_the_api_does_not_advertise_an_execution_model_it_does_not_have() -> None:
    """Guards Phase 5's decision: claim synchronous, or build the queue.

    Each of these was a live claim of asynchronous execution with nothing behind
    it. They come back together with a real worker - see docs/architecture.md,
    "Execution model" - not one at a time.
    """
    from railniyojan.contracts.api import PlanningRunCreatedResponse
    from railniyojan.contracts.enums import PlanningRunState

    # No lifecycle state that nothing can assign.
    assert set(PlanningRunState) == {
        PlanningRunState.FEASIBLE,
        PlanningRunState.OPTIMAL,
        PlanningRunState.INFEASIBLE,
        PlanningRunState.TIMEOUT,
        PlanningRunState.INVALID,
        PlanningRunState.FAILED,
    }

    # No status endpoint for a run that is already finished when it is returned.
    fields = PlanningRunCreatedResponse.model_fields
    assert "detail_url" in fields
    assert "status_url" not in fields

    # No worker module: the optimizer is a library the API calls in-process.
    with pytest.raises(ModuleNotFoundError):
        __import__("railniyojan.optimizer.worker")


def test_a_created_run_is_already_finished_when_the_response_arrives(snapshot_id: str) -> None:
    """The response is the result, not a receipt for work that is still queued."""
    client = TestClient(app)
    created = client.post(
        "/planning-runs",
        json={"snapshot_id": snapshot_id, "ruleset_version": "Demo Ruleset v1"},
    )

    assert created.status_code == 201
    body = created.json()
    assert body["state"] in TERMINAL_STATES
    # detail_url addresses a complete run, so one GET is enough - no polling.
    detail = client.get(body["detail_url"])
    assert detail.status_code == 200
    assert detail.json()["state"] == body["state"]
    assert detail.json()["schedule_items"]
