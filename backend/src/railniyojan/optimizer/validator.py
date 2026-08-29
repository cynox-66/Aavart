from __future__ import annotations

from typing import Any

from railniyojan.contracts.models import DatasetPayload, ScheduleItem


def _overlaps(first: ScheduleItem, second: ScheduleItem) -> bool:
    return first.start < second.end and second.start < first.end


def validate_schedule(
    dataset: DatasetPayload,
    items: list[ScheduleItem],
    required_locked: list[ScheduleItem] | None = None,
) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    jobs = {job.job_id: job for job in dataset.jobs}
    windows = {window.window_id: window for window in dataset.windows}

    if len({item.job_id for item in items}) != len(items):
        issues.append({"code": "SAFETY_VALIDATION_FAILED", "message": "job scheduled twice"})

    for item in items:
        job = jobs.get(item.job_id)
        window = windows.get(item.window_id)
        if job is None or window is None:
            issues.append(
                {
                    "code": "SAFETY_VALIDATION_FAILED",
                    "job_id": item.job_id,
                    "message": "unknown job or window",
                }
            )
            continue
        if (
            item.window_id not in job.allowed_windows
            or item.start < window.start
            or item.end > window.end
        ):
            issues.append(
                {
                    "code": "SAFETY_VALIDATION_FAILED",
                    "job_id": item.job_id,
                    "message": "item is outside its allowed window",
                }
            )
        if int((item.end - item.start).total_seconds() / 60) != job.duration_minutes:
            issues.append(
                {
                    "code": "SAFETY_VALIDATION_FAILED",
                    "job_id": item.job_id,
                    "message": "item duration differs from nominal duration",
                }
            )
        for path in dataset.train_paths:
            if (
                path.section_id == job.section_id
                and item.start < path.end
                and path.start < item.end
            ):
                issues.append(
                    {
                        "code": "TRAIN_PATH_CONFLICT",
                        "job_id": item.job_id,
                        "message": "item overlaps a train path",
                    }
                )

    section_groups = [
        set(group.member_ids)
        for group in dataset.conflict_groups
        if group.conflict_type == "SECTION"
    ]
    isolation_groups = [
        set(group.member_ids)
        for group in dataset.conflict_groups
        if group.conflict_type == "ISOLATION"
    ]
    for index, first in enumerate(items):
        for second in items[index + 1 :]:
            if not _overlaps(first, second):
                continue
            first_job = jobs[first.job_id]
            second_job = jobs[second.job_id]
            if set(first_job.required_resources) & set(second_job.required_resources):
                issues.append(
                    {
                        "code": "RESOURCE_CONFLICT",
                        "message": f"{first.job_id} overlaps {second.job_id}",
                    }
                )
            pair = {first.job_id, second.job_id}
            if any(pair <= group for group in section_groups):
                issues.append(
                    {
                        "code": "SECTION_CONFLICT",
                        "message": f"{first.job_id} overlaps {second.job_id}",
                    }
                )
            if any(pair <= group for group in isolation_groups):
                issues.append(
                    {
                        "code": "ISOLATION_CONFLICT",
                        "message": f"{first.job_id} overlaps {second.job_id}",
                    }
                )

    actual = {item.job_id: item for item in items}
    for locked in required_locked or []:
        if actual.get(locked.job_id) != locked:
            issues.append(
                {
                    "code": "SAFETY_VALIDATION_FAILED",
                    "job_id": locked.job_id,
                    "message": "locked item moved or disappeared",
                }
            )
    return issues
