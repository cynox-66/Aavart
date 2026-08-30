"""Plan KPIs that survive an adversarial reading.

The headline number answers one question: given the jobs this plan actually
schedules, how much less track time do they consume together than they would
one possession at a time? Four rules keep that honest.

1. Both sides cover the same job set - the scheduled jobs. A rejected job leaves
   the baseline as well as the optimized side, so refusing work can no longer
   pay. The previous version dropped rejected jobs from the optimized side while
   leaving them in the baseline, which made "schedule nothing" score 100%.
2. Coverage travels with the reduction. `scheduled_jobs` / `total_jobs` and the
   minute equivalents are part of the summary, never optional, because a
   reduction figure without coverage beside it is exactly what let the metric be
   gamed in the first place.
3. The baseline is named. It is not a human plan; it is serial per-section
   stacking, declared as `baseline_method` and reported as
   `serial_baseline_closure_minutes`.
4. Asset downtime is computed against assets. It used to be a byte-identical
   copy of section closure, which are different concepts in railway operations.
   One counterfactual schedule is measured two ways: union by section and union
   by asset. They coincide in the baseline, where no job shares a possession,
   and diverge in the optimized plan - which is the point. Co-locating two jobs
   on different assets buys one section closure but still costs two assets their
   downtime, so section closure falls faster than asset downtime.

Note on the objective: planner.py maximises priority-weighted job count and has
no closure term. Closure reduction is therefore a measured outcome of that
objective, not the quantity being optimised - present it that way.

docs/solver_capacity.md carries the measured coverage for the demo corridors and
explains what the planner cannot fit, which is the other half of any honest
reading of these numbers.
"""

from __future__ import annotations

from datetime import datetime

from railniyojan.contracts.api import KpiSummary
from railniyojan.contracts.models import DatasetPayload, Job, ScheduleItem

BASELINE_METHOD = "SERIAL_PER_SECTION"


def _union_minutes(intervals: list[tuple[int, int]]) -> int:
    """Total minutes covered by the union of half-open intervals."""
    if not intervals:
        return 0
    total = 0
    ordered = sorted(intervals)
    current_start, current_end = ordered[0]
    for start, end in ordered[1:]:
        if start <= current_end:
            current_end = max(current_end, end)
            continue
        total += current_end - current_start
        current_start, current_end = start, end
    total += current_end - current_start
    return total


def _minutes_from_origin(origin: datetime, value: datetime) -> int:
    return int((value - origin).total_seconds() // 60)


def _serial_baseline_spans(
    jobs: list[Job], first_window_minute: dict[str, int]
) -> list[tuple[Job, tuple[int, int]]]:
    """The counterfactual schedule: one possession per job, none shared.

    Each section's jobs are stacked back to back from that section's first
    window, in dataset order. This is a single schedule, measured two ways below
    - by section and by asset - rather than two unrelated baselines.
    """
    spans: list[tuple[Job, tuple[int, int]]] = []
    cursor: dict[str, int] = {}
    for job in jobs:
        # A validated dataset always has a window in the job's own section
        # (allowed_windows has min_length=1 and every allowed window must belong
        # to that section), so this default is defensive only.
        start = cursor.get(job.section_id, first_window_minute.get(job.section_id, 0))
        spans.append((job, (start, start + job.duration_minutes)))
        cursor[job.section_id] = start + job.duration_minutes
    return spans


def _group(spans: list[tuple[Job, tuple[int, int]]], key: str) -> dict[str, list[tuple[int, int]]]:
    grouped: dict[str, list[tuple[int, int]]] = {}
    for job, span in spans:
        grouped.setdefault(getattr(job, key), []).append(span)
    return grouped


def calculate_kpis(dataset: DatasetPayload, schedule_items: list[ScheduleItem]) -> KpiSummary:
    origin = min(window.start for window in dataset.windows)
    schedule_by_job = {item.job_id: item for item in schedule_items}
    first_window_minute = {
        section_id: _minutes_from_origin(
            origin,
            min(window.start for window in dataset.windows if window.section_id == section_id),
        )
        for section_id in {window.section_id for window in dataset.windows}
    }

    scheduled_jobs = [job for job in dataset.jobs if job.job_id in schedule_by_job]
    rejected_jobs = [job for job in dataset.jobs if job.job_id not in schedule_by_job]

    optimized_spans = [
        (
            job,
            (
                _minutes_from_origin(origin, schedule_by_job[job.job_id].start),
                _minutes_from_origin(origin, schedule_by_job[job.job_id].end),
            ),
        )
        for job in scheduled_jobs
    ]
    # Both sides are built from `scheduled_jobs` alone. This is the fix that
    # stops rejection from paying.
    baseline_spans = _serial_baseline_spans(scheduled_jobs, first_window_minute)

    def total(spans: list[tuple[Job, tuple[int, int]]], key: str) -> int:
        return sum(_union_minutes(group) for group in _group(spans, key).values())

    baseline_closure = total(baseline_spans, "section_id")
    optimized_closure = total(optimized_spans, "section_id")
    baseline_asset = total(baseline_spans, "asset_id")
    optimized_asset = total(optimized_spans, "asset_id")

    def reduce(baseline: int, optimized: int) -> tuple[int, float]:
        saved = max(0, baseline - optimized)
        return saved, round((saved / baseline) * 100, 2) if baseline else 0.0

    reduction, percent = reduce(baseline_closure, optimized_closure)
    asset_reduction, asset_percent = reduce(baseline_asset, optimized_asset)

    scheduled_minutes = sum(job.duration_minutes for job in scheduled_jobs)
    rejected_minutes = sum(job.duration_minutes for job in rejected_jobs)
    total_jobs = len(dataset.jobs)
    total_minutes = scheduled_minutes + rejected_minutes

    return KpiSummary(
        baseline_method=BASELINE_METHOD,
        serial_baseline_closure_minutes=baseline_closure,
        optimized_closure_minutes=optimized_closure,
        scheduled_maintenance_minutes=scheduled_minutes,
        rejected_maintenance_minutes=rejected_minutes,
        serial_baseline_asset_downtime_minutes=baseline_asset,
        optimized_asset_downtime_minutes=optimized_asset,
        asset_downtime_reduction_minutes=asset_reduction,
        asset_downtime_reduction_percent=asset_percent,
        downtime_reduction_minutes=reduction,
        downtime_reduction_percent=percent,
        scheduled_jobs=len(scheduled_jobs),
        total_jobs=total_jobs,
        job_coverage_percent=(
            round((len(scheduled_jobs) / total_jobs) * 100, 2) if total_jobs else 0.0
        ),
        minute_coverage_percent=(
            round((scheduled_minutes / total_minutes) * 100, 2) if total_minutes else 0.0
        ),
    )
