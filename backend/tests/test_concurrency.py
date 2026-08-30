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
        # the end. There is no QUEUED or RUNNING record to observe, which is the
        # lifecycle Phase 5 either deletes or makes real.
        assert all(
            summary["state"] not in {"QUEUED", "RUNNING"} for summary in listed.json()
        )

        created = await run
        detail = await client.get(f"/planning-runs/{created.json()['run_id']}", timeout=5)
        assert detail.status_code == 200
        assert detail.json()["state"] in {"OPTIMAL", "FEASIBLE"}
