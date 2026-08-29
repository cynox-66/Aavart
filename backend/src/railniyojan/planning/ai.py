from __future__ import annotations

from copy import deepcopy

from railniyojan.contracts.api import AiEstimate
from railniyojan.contracts.models import DatasetPayload


class LocalHeuristicEstimator:
    """Local, deterministic AI-assist substitute for priority and duration estimates."""

    def estimate(self, dataset: DatasetPayload) -> tuple[DatasetPayload, list[AiEstimate]]:
        adjusted = deepcopy(dataset)
        estimates: list[AiEstimate] = []
        for job in adjusted.jobs:
            try:
                priority = min(100, max(0, job.priority + self._priority_delta(job.work_type)))
                duration = min(
                    job.duration_max_minutes,
                    max(job.duration_min_minutes, job.duration_minutes),
                )
                job.priority = priority
                job.duration_minutes = duration
                estimates.append(
                    AiEstimate(
                        job_id=job.job_id,
                        source="LOCAL_HEURISTIC",
                        priority=priority,
                        duration_minutes=duration,
                        duration_min_minutes=job.duration_min_minutes,
                        duration_max_minutes=job.duration_max_minutes,
                        reason_codes=["LOCAL_HEURISTIC_ESTIMATE"],
                    )
                )
            except ValueError:
                estimates.append(
                    AiEstimate(
                        job_id=job.job_id,
                        source="DETERMINISTIC_FALLBACK",
                        priority=job.priority,
                        duration_minutes=job.duration_minutes,
                        duration_min_minutes=job.duration_min_minutes,
                        duration_max_minutes=job.duration_max_minutes,
                        reason_codes=["AI_FALLBACK_USED"],
                    )
                )
        return adjusted, estimates

    @staticmethod
    def _priority_delta(work_type: str) -> int:
        lowered = work_type.lower()
        if "urgent" in lowered or "defect" in lowered:
            return 10
        if "inspection" in lowered:
            return 2
        return 0
