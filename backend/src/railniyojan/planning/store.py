from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import RLock
from uuid import uuid4

from railniyojan.contracts.api import ApprovalSummary
from railniyojan.contracts.enums import PlanningRunState
from railniyojan.contracts.models import DatasetPayload, ScheduleItem


@dataclass
class SnapshotRecord:
    snapshot_id: str
    dataset: DatasetPayload
    source_hash: str
    status: str = "VALID"
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class RunRecord:
    run_id: str
    snapshot_id: str
    ruleset_version: str
    state: PlanningRunState
    created_at: datetime
    completed_at: datetime | None
    schedule_items: list[ScheduleItem]
    unscheduled_reason_codes: dict[str, list[str]]
    validator_passed: bool
    validator_issues: list[dict[str, object]]
    validated_at: datetime
    parent_run_id: str | None = None
    approval: ApprovalSummary | None = None
    changes: dict[str, str] = field(default_factory=dict)


class PlanningStore:
    def __init__(self) -> None:
        self._snapshots: dict[str, SnapshotRecord] = {}
        self._runs: dict[str, RunRecord] = {}
        self._lock = RLock()

    def register_snapshot(
        self, snapshot_id: str, source_hash: str, dataset: DatasetPayload
    ) -> SnapshotRecord:
        with self._lock:
            existing = self._snapshots.get(snapshot_id)
            if existing is not None:
                return deepcopy(existing)
            record = SnapshotRecord(snapshot_id, deepcopy(dataset), source_hash)
            self._snapshots[snapshot_id] = record
            return deepcopy(record)

    def get_snapshot(self, snapshot_id: str) -> SnapshotRecord | None:
        with self._lock:
            record = self._snapshots.get(snapshot_id)
            return deepcopy(record) if record else None

    def set_snapshot_status(self, snapshot_id: str, status: str) -> None:
        with self._lock:
            self._snapshots[snapshot_id].status = status

    def save_run(self, run: RunRecord) -> RunRecord:
        with self._lock:
            self._runs[run.run_id] = deepcopy(run)
            return deepcopy(run)

    def get_run(self, run_id: str) -> RunRecord | None:
        with self._lock:
            record = self._runs.get(run_id)
            return deepcopy(record) if record else None

    def update_run(self, run: RunRecord) -> RunRecord:
        with self._lock:
            if run.run_id not in self._runs:
                raise KeyError(run.run_id)
            self._runs[run.run_id] = deepcopy(run)
            return deepcopy(run)

    @staticmethod
    def next_run_id() -> str:
        return f"RUN-{uuid4().hex[:12].upper()}"

    def clear(self) -> None:
        with self._lock:
            self._snapshots.clear()
            self._runs.clear()


planning_store = PlanningStore()
