from __future__ import annotations

from datetime import datetime

from railniyojan.contracts.api import KpiSummary
from railniyojan.contracts.models import DatasetPayload, ScheduleItem


def _union_minutes(intervals: list[tuple[int, int]]) -> int:
    if not intervals:
        return 0
    total = 0
    current_start, current_end = sorted(intervals)[0]
    for start, end in sorted(intervals)[1:]:
        if start <= current_end:
            current_end = max(current_end, end)
            continue
        total += current_end - current_start
        current_start, current_end = start, end
    total += current_end - current_start
    return total


def _minutes_from_origin(origin: datetime, value: datetime) -> int:
    return int((value - origin).total_seconds() // 60)


def calculate_kpis(dataset: DatasetPayload, schedule_items: list[ScheduleItem]) -> KpiSummary:
    origin = min(window.start for window in dataset.windows)
    schedule_by_job = {item.job_id: item for item in schedule_items}
    scheduled_minutes = 0
    rejected_minutes = 0
    optimized_by_section: dict[str, list[tuple[int, int]]] = {}
    baseline_by_section: dict[str, list[tuple[int, int]]] = {}

    cursor_by_section: dict[str, int] = {}
    first_window_by_section = {
        section_id: min(
            window.start for window in dataset.windows if window.section_id == section_id
        )
        for section_id in {window.section_id for window in dataset.windows}
    }

    for job in dataset.jobs:
        scheduled = schedule_by_job.get(job.job_id)
        if scheduled is not None:
            scheduled_minutes += job.duration_minutes
            optimized_by_section.setdefault(job.section_id, []).append(
                (
                    _minutes_from_origin(origin, scheduled.start),
                    _minutes_from_origin(origin, scheduled.end),
                )
            )
        else:
            rejected_minutes += job.duration_minutes

        cursor = cursor_by_section.get(
            job.section_id,
            _minutes_from_origin(origin, first_window_by_section[job.section_id]),
        )
        baseline_by_section.setdefault(job.section_id, []).append(
            (cursor, cursor + job.duration_minutes)
        )
        cursor_by_section[job.section_id] = cursor + job.duration_minutes

    baseline_closure = sum(_union_minutes(intervals) for intervals in baseline_by_section.values())
    optimized_closure = sum(
        _union_minutes(intervals) for intervals in optimized_by_section.values()
    )
    reduction = max(0, baseline_closure - optimized_closure)
    percent = round((reduction / baseline_closure) * 100, 2) if baseline_closure else 0.0
    return KpiSummary(
        baseline_closure_minutes=baseline_closure,
        optimized_closure_minutes=optimized_closure,
        scheduled_maintenance_minutes=scheduled_minutes,
        rejected_maintenance_minutes=rejected_minutes,
        baseline_asset_downtime_minutes=baseline_closure,
        optimized_asset_downtime_minutes=optimized_closure,
        downtime_reduction_minutes=reduction,
        downtime_reduction_percent=percent,
    )
