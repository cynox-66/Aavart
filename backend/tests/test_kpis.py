"""Adversarial tests for the plan KPIs.

Gap 9: the headline metric used to be maximised by scheduling nothing. Rejected
jobs vanished from the optimized side while staying in the baseline, so refusing
all work scored a perfect 100% "downtime saved". These tests pin the properties
that make the number defensible rather than pinning the numbers themselves.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import pytest

from railniyojan.contracts.models import DatasetPayload, ScheduleItem
from railniyojan.planning.kpis import calculate_kpis

ORIGIN = datetime.fromisoformat("2026-10-01T22:00:00+05:30")
SEC_A = {
    "section_id": "SEC-A",
    "from_node": "A",
    "to_node": "B",
    "line": "MAIN",
    "direction": "BOTH",
}
SEC_B = {
    "section_id": "SEC-B",
    "from_node": "B",
    "to_node": "C",
    "line": "MAIN",
    "direction": "BOTH",
}


def _dataset(jobs: list[dict[str, Any]], **overrides: Any) -> DatasetPayload:
    """A minimal single-section dataset with a window wide enough for anything."""
    sections = overrides.get("sections") or [SEC_A]
    assets = overrides.get("assets") or [
        {"asset_id": "AST-1", "asset_type": "TRACK", "section_id": "SEC-A", "status": "AVAILABLE"},
        {"asset_id": "AST-2", "asset_type": "SIGNAL", "section_id": "SEC-A", "status": "AVAILABLE"},
    ]
    windows = overrides.get("windows") or [
        {
            "window_id": "WIN-1",
            "start": ORIGIN.isoformat(),
            "end": (ORIGIN + timedelta(hours=12)).isoformat(),
            "section_id": "SEC-A",
            "availability": "AVAILABLE",
        }
    ]
    return DatasetPayload(
        schema_version="1.0",
        sections=sections,
        assets=assets,
        resources=[
            {
                "resource_id": "RES-1",
                "resource_type": "GANG",
                "capacity": 4,
                "availability": "AVAILABLE",
            }
        ],
        windows=windows,
        jobs=[
            {
                "department": "TRACK",
                "asset_id": "AST-1",
                "section_id": "SEC-A",
                "work_type": "TAMPING",
                "priority": 50,
                "duration_min_minutes": 30,
                "duration_max_minutes": 600,
                "required_resources": ["RES-1"],
                "allowed_windows": ["WIN-1"],
                "status": "UNSCHEDULED",
                **job,
            }
            for job in jobs
        ],
        train_paths=[],
        conflict_groups=[],
        metadata={},
    )


def _item(job_id: str, offset_minutes: int, duration_minutes: int) -> ScheduleItem:
    start = ORIGIN + timedelta(minutes=offset_minutes)
    return ScheduleItem(
        job_id=job_id,
        window_id="WIN-1",
        start=start,
        end=start + timedelta(minutes=duration_minutes),
        status="SCHEDULED",
        reason_codes=["OK"],
        locked=False,
    )


TWO_JOBS = [
    {"job_id": "JOB-001", "duration_minutes": 120, "asset_id": "AST-1"},
    {"job_id": "JOB-002", "duration_minutes": 120, "asset_id": "AST-2"},
]


def test_scheduling_nothing_does_not_score_a_reduction() -> None:
    """The headline adversarial case. This returned 100.0 before the fix."""
    kpis = calculate_kpis(_dataset(TWO_JOBS), [])

    assert kpis.closure_reduction_percent == 0.0
    assert kpis.closure_reduction_minutes == 0
    assert kpis.scheduled_jobs == 0
    assert kpis.job_coverage_percent == 0.0


def test_rejecting_a_long_job_never_beats_scheduling_it() -> None:
    """Dropping work must not be a way to improve the number."""
    jobs = [
        {"job_id": "JOB-001", "duration_minutes": 120, "asset_id": "AST-1"},
        {"job_id": "JOB-002", "duration_minutes": 480, "asset_id": "AST-2"},
    ]
    dataset = _dataset(jobs)

    # Both jobs co-located in one possession.
    both = calculate_kpis(dataset, [_item("JOB-001", 0, 120), _item("JOB-002", 0, 480)])
    # The long job refused; the short one takes the same slot.
    dropped = calculate_kpis(dataset, [_item("JOB-001", 0, 120)])

    assert both.closure_reduction_percent > dropped.closure_reduction_percent
    assert both.job_coverage_percent > dropped.job_coverage_percent


def test_coverage_is_always_reported_alongside_the_reduction() -> None:
    dataset = _dataset(TWO_JOBS)
    kpis = calculate_kpis(dataset, [_item("JOB-001", 0, 120)])

    assert (kpis.scheduled_jobs, kpis.total_jobs) == (1, 2)
    assert kpis.job_coverage_percent == 50.0
    assert kpis.maintenance_coverage_percent == 50.0
    assert kpis.scheduled_maintenance_minutes == 120
    assert kpis.rejected_maintenance_minutes == 120


def test_asset_downtime_differs_from_section_closure_when_a_possession_is_shared() -> None:
    """Two assets worked under one section closure still cost two assets their time."""
    dataset = _dataset(TWO_JOBS)
    kpis = calculate_kpis(dataset, [_item("JOB-001", 0, 120), _item("JOB-002", 0, 120)])

    # One 120-minute possession covers the section...
    assert kpis.optimized_closure_minutes == 120
    # ...but both assets are down for those 120 minutes.
    assert kpis.optimized_asset_downtime_minutes == 240
    assert kpis.optimized_asset_downtime_minutes != kpis.optimized_closure_minutes

    # And the two reductions must not be the same number either: co-locating buys
    # a 50% cut in section closure and nothing at all in asset downtime.
    assert kpis.closure_reduction_percent == 50.0
    assert kpis.asset_downtime_reduction_percent == 0.0


def test_co_location_is_what_produces_the_reduction() -> None:
    dataset = _dataset(TWO_JOBS)

    co_located = calculate_kpis(dataset, [_item("JOB-001", 0, 120), _item("JOB-002", 0, 120)])
    sequential = calculate_kpis(dataset, [_item("JOB-001", 0, 120), _item("JOB-002", 120, 120)])

    # Serial baseline for two 120-minute jobs in one section is 240 minutes.
    assert co_located.serial_baseline_closure_minutes == 240
    assert sequential.serial_baseline_closure_minutes == 240
    assert co_located.closure_reduction_percent == 50.0
    # A plan that saves nothing must say so, not borrow credit from rejection.
    assert sequential.closure_reduction_percent == 0.0


def test_the_baseline_names_its_method() -> None:
    kpis = calculate_kpis(_dataset(TWO_JOBS), [_item("JOB-001", 0, 120)])

    assert kpis.baseline_method == "SERIAL_PER_SECTION"


def test_a_worse_than_baseline_plan_floors_at_zero_rather_than_going_negative() -> None:
    """Windows are wide, so a schedule can in principle spread past the baseline."""
    dataset = _dataset(TWO_JOBS)
    kpis = calculate_kpis(dataset, [_item("JOB-001", 0, 120), _item("JOB-002", 400, 120)])

    assert kpis.closure_reduction_minutes == 0
    assert kpis.closure_reduction_percent == 0.0


def test_sections_are_measured_independently() -> None:
    dataset = _dataset(
        [
            {
                "job_id": "JOB-001",
                "duration_minutes": 120,
                "asset_id": "AST-1",
                "section_id": "SEC-A",
            },
            {
                "job_id": "JOB-002",
                "duration_minutes": 120,
                "asset_id": "AST-3",
                "section_id": "SEC-B",
            },
        ],
        sections=[SEC_A, SEC_B],
        assets=[
            {
                "asset_id": "AST-1",
                "asset_type": "TRACK",
                "section_id": "SEC-A",
                "status": "AVAILABLE",
            },
            {
                "asset_id": "AST-3",
                "asset_type": "TRACK",
                "section_id": "SEC-B",
                "status": "AVAILABLE",
            },
        ],
        windows=[
            {
                "window_id": "WIN-1",
                "start": ORIGIN.isoformat(),
                "end": (ORIGIN + timedelta(hours=12)).isoformat(),
                "section_id": "SEC-A",
                "availability": "AVAILABLE",
            },
            {
                "window_id": "WIN-2",
                "start": ORIGIN.isoformat(),
                "end": (ORIGIN + timedelta(hours=12)).isoformat(),
                "section_id": "SEC-B",
                "availability": "AVAILABLE",
            },
        ],
    )
    kpis = calculate_kpis(dataset, [_item("JOB-001", 0, 120), _item("JOB-002", 0, 120)])

    # Concurrent work in two different sections closes both; nothing is saved.
    assert kpis.serial_baseline_closure_minutes == 240
    assert kpis.optimized_closure_minutes == 240
    assert kpis.closure_reduction_percent == 0.0


@pytest.mark.parametrize("fixture_name", ["corridor_1", "corridor_2"])
def test_real_corridors_report_coverage_consistently(
    fixture_name: str, repository_root: Any
) -> None:
    """A guard against quietly regaining the inflated headline.

    Deliberately asserts invariants, not a coverage range. An earlier version
    pinned coverage below 60% - true when every job was locked to a single
    window, and wrong the moment the fixture let jobs use any window in their own
    section. Pinning the symptom would have made a genuine improvement look like
    a regression.

    What must always hold: the two sides account for every job, rejection cannot
    pay, and the reduction is measured over the scheduled set alone.
    """
    import json

    from railniyojan.optimizer.contracts import OptimizerInput
    from railniyojan.optimizer.planner import DeterministicPlanner
    from railniyojan.planning.ai import LocalHeuristicEstimator

    path = repository_root / "fixtures" / "generated" / fixture_name / "dataset.json"
    dataset = DatasetPayload(**json.loads(path.read_text()))
    planned, _ = LocalHeuristicEstimator().estimate(dataset)
    output = DeterministicPlanner().solve(
        OptimizerInput(
            run_id="RUN-TEST",
            snapshot_id="SNAP-TEST",
            ruleset_version="Demo Ruleset v1",
            deterministic_seed=26027,
            # The corridor plans are found in well under 0.5 s; the rest of the
            # configured budget goes on *proving* optimality, which takes ~43 s
            # and yields the identical schedule. Two seconds keeps CI honest and
            # fast - see docs/solver_capacity.md.
            time_budget_seconds=2,
            dataset=planned,
        )
    )
    kpis = calculate_kpis(planned, output.schedule_items)

    # Coverage accounts for every job and every minute, with nothing unexplained.
    assert kpis.scheduled_jobs == len(output.schedule_items)
    assert kpis.total_jobs == len(planned.jobs)
    assert kpis.scheduled_jobs <= kpis.total_jobs
    assert kpis.scheduled_maintenance_minutes + kpis.rejected_maintenance_minutes == sum(
        job.duration_minutes for job in planned.jobs
    )

    # Rejection still cannot pay, on the real corridor and not just a toy fixture.
    assert calculate_kpis(planned, []).closure_reduction_percent == 0.0

    # The reduction is real, bounded, and comes from co-location rather than from
    # dropping work: more job-minutes are scheduled than the closure they consume.
    assert 0 < kpis.closure_reduction_percent < 100
    assert kpis.optimized_closure_minutes < kpis.scheduled_maintenance_minutes

    # Section closure and asset downtime are genuinely different measurements.
    assert kpis.optimized_asset_downtime_minutes != kpis.optimized_closure_minutes


@pytest.mark.parametrize("fixture_name", ["corridor_1", "corridor_2"])
def test_the_planner_drops_low_priority_work_first(
    fixture_name: str, repository_root: Any
) -> None:
    """Whatever cannot fit must be the least important work, not an arbitrary slice."""
    import json

    from railniyojan.optimizer.contracts import OptimizerInput
    from railniyojan.optimizer.planner import DeterministicPlanner
    from railniyojan.planning.ai import LocalHeuristicEstimator

    path = repository_root / "fixtures" / "generated" / fixture_name / "dataset.json"
    dataset = DatasetPayload(**json.loads(path.read_text()))
    planned, _ = LocalHeuristicEstimator().estimate(dataset)
    output = DeterministicPlanner().solve(
        OptimizerInput(
            run_id="RUN-TEST",
            snapshot_id="SNAP-TEST",
            ruleset_version="Demo Ruleset v1",
            deterministic_seed=26027,
            # The corridor plans are found in well under 0.5 s; the rest of the
            # configured budget goes on *proving* optimality, which takes ~43 s
            # and yields the identical schedule. Two seconds keeps CI honest and
            # fast - see docs/solver_capacity.md.
            time_budget_seconds=2,
            dataset=planned,
        )
    )
    scheduled_ids = {item.job_id for item in output.schedule_items}
    scheduled = [job for job in planned.jobs if job.job_id in scheduled_ids]
    rejected = [job for job in planned.jobs if job.job_id not in scheduled_ids]

    assert rejected, "fixture should still exercise the rejection path"
    mean_scheduled = sum(job.priority for job in scheduled) / len(scheduled)
    mean_rejected = sum(job.priority for job in rejected) / len(rejected)
    assert mean_rejected < mean_scheduled

    # Every rejected job carries a reason the UI can show.
    for job in rejected:
        assert output.unscheduled_reason_codes[job.job_id]
