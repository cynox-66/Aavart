from __future__ import annotations

from copy import deepcopy
from typing import cast

from fastapi import APIRouter

from railniyojan.api.errors import ApiError
from railniyojan.api.routes.planning_runs import (
    _execute_run,
    _run_or_404,
    _snapshot_or_404,
    derive_snapshot_id,
)
from railniyojan.api.settings import get_settings
from railniyojan.contracts.api import (
    RapidBlockDetail,
    RapidBlockRequestCreate,
    RapidBlockResponse,
    ValidatorSummary,
)
from railniyojan.contracts.enums import Availability, PlanningRunState, RapidBlockState
from railniyojan.contracts.models import DatasetPayload, Job, ScheduleItem
from railniyojan.planning.store import (
    AuditEventRecord,
    PlanningStore,
    RapidBlockRecord,
    planning_store,
)

router = APIRouter(prefix="/rapidblock-requests", tags=["rapidblock"])


def _allowed_planners() -> set[str]:
    return {
        actor.strip()
        for actor in get_settings().planner_allowlist.split(",")
        if actor.strip()
    }


def _response(record: RapidBlockRecord) -> RapidBlockResponse:
    return RapidBlockResponse(
        request_id=record.request_id,
        state=record.state,
        base_run_id=record.base_run_id,
        base_snapshot_id=record.base_snapshot_id,
        derived_snapshot_id=record.derived_snapshot_id,
        child_run_id=record.child_run_id,
        reason_codes=record.reason_codes,
        detail_url=f"/rapidblock-requests/{record.request_id}",
    )


def _audit(entity_id: str, event_type: str, actor: str, **metadata: object) -> None:
    cast(PlanningStore, planning_store).add_audit_event(
        AuditEventRecord(
            event_id=planning_store.next_event_id(),
            entity_type="rapidblock_request",
            entity_id=entity_id,
            event_type=event_type,
            actor=actor,
            metadata=metadata,
        )
    )


def _reject(record: RapidBlockRecord, code: str, status_code: int = 422) -> None:
    record.state = RapidBlockState.REJECTED
    record.reason_codes = [code]
    cast(PlanningStore, planning_store).save_rapidblock_request(record)
    _audit(record.request_id, "REJECTED", record.actor, code=code)
    raise ApiError(status_code, code, "RapidBlock request was rejected")


def _validate_urgent_job_scope(dataset: DatasetPayload, job: Job) -> str | None:
    section_ids = {section.section_id for section in dataset.sections}
    assets = {asset.asset_id: asset for asset in dataset.assets}
    resources = {resource.resource_id: resource for resource in dataset.resources}
    windows = {window.window_id: window for window in dataset.windows}
    if job.section_id not in section_ids:
        return "OUTSIDE_PLANNING_SCOPE"
    asset = assets.get(job.asset_id)
    if asset is None or asset.section_id != job.section_id:
        return "OUTSIDE_PLANNING_SCOPE"
    if any(resource_id not in resources for resource_id in job.required_resources):
        return "OUTSIDE_PLANNING_SCOPE"
    for window_id in job.allowed_windows:
        window = windows.get(window_id)
        if window is None or window.section_id != job.section_id:
            return "OUTSIDE_PLANNING_SCOPE"
    return None


def _has_eligible_window(dataset: DatasetPayload, job: Job) -> bool:
    windows = {window.window_id: window for window in dataset.windows}
    for window_id in job.allowed_windows:
        window = windows[window_id]
        duration = int((window.end - window.start).total_seconds() // 60)
        if window.availability == Availability.AVAILABLE and duration >= job.duration_minutes:
            return True
    return False


def _would_conflict_with_lock(
    dataset: DatasetPayload, job: Job, locked_items: list[ScheduleItem]
) -> bool:
    allowed_windows = {window.window_id: window for window in dataset.windows}
    if not locked_items:
        return False
    for window_id in job.allowed_windows:
        window = allowed_windows[window_id]
        if window.availability != Availability.AVAILABLE:
            continue
        blocked = [
            (locked.start, locked.end)
            for locked in locked_items
            if locked.window_id == window.window_id
            and next(item for item in dataset.jobs if item.job_id == locked.job_id).section_id
            == job.section_id
        ]
        cursor = window.start
        for start, end in sorted(blocked):
            if int((start - cursor).total_seconds() // 60) >= job.duration_minutes:
                return False
            cursor = max(cursor, end)
        if int((window.end - cursor).total_seconds() // 60) >= job.duration_minutes:
            return False
    return True


@router.post("", response_model=RapidBlockResponse, status_code=201)
def create_rapidblock_request(request: RapidBlockRequestCreate) -> RapidBlockResponse:
    base_run = _run_or_404(request.base_run_id)
    base_snapshot = _snapshot_or_404(base_run.snapshot_id)
    record = RapidBlockRecord(
        request_id=planning_store.next_request_id(),
        base_run_id=base_run.run_id,
        base_snapshot_id=base_snapshot.snapshot_id,
        actor=request.actor,
        actor_role=request.actor_role,
        justification=request.justification,
        source_reported_at=request.source_reported_at,
        urgent_job=request.urgent_job,
        state=RapidBlockState.VALIDATING,
        reason_codes=[],
    )
    cast(PlanningStore, planning_store).save_rapidblock_request(record)
    _audit(record.request_id, "SUBMITTED", request.actor, base_run_id=base_run.run_id)

    if request.actor not in _allowed_planners():
        _reject(record, "UNAUTHORISED_ACTOR", 403)
    scope_error = _validate_urgent_job_scope(base_snapshot.dataset, request.urgent_job)
    if scope_error is not None:
        _reject(record, scope_error)
    if not _has_eligible_window(base_snapshot.dataset, request.urgent_job):
        _reject(record, "NO_ELIGIBLE_WINDOW")

    locked_items = [item.model_copy(deep=True) for item in base_run.schedule_items if item.locked]
    if _would_conflict_with_lock(base_snapshot.dataset, request.urgent_job, locked_items):
        _reject(record, "LOCK_CONFLICT")

    derived_dataset = deepcopy(base_snapshot.dataset)
    derived_dataset.jobs.append(request.urgent_job)
    derived_payload = derived_dataset.model_dump(mode="json")
    derived_payload["metadata"] = {
        **derived_payload.get("metadata", {}),
        "parent_snapshot_id": base_snapshot.snapshot_id,
        "rapidblock_request_id": record.request_id,
    }
    derived_snapshot_id, source_hash = derive_snapshot_id(derived_payload)
    derived_snapshot = cast(PlanningStore, planning_store).register_snapshot(
        derived_snapshot_id,
        source_hash,
        DatasetPayload.model_validate(derived_payload),
        parent_snapshot_id=base_snapshot.snapshot_id,
        derivation_type="RAPIDBLOCK",
        derived_from_request_id=record.request_id,
        created_by=request.actor,
    )
    child_run = _execute_run(
        derived_snapshot,
        base_run.ruleset_version,
        parent_run_id=base_run.run_id,
        fixed_items=locked_items,
        required_locked=locked_items,
    )
    child_run.rapidblock_request_id = record.request_id
    child_run.trigger_type = "RAPIDBLOCK"

    urgent_scheduled = any(
        item.job_id == request.urgent_job.job_id for item in child_run.schedule_items
    )
    record.derived_snapshot_id = derived_snapshot.snapshot_id
    record.child_run_id = child_run.run_id
    record.changed_jobs = child_run.changes
    record.preserved_locked_jobs = [item.job_id for item in locked_items]
    if (
        urgent_scheduled
        and child_run.validator_passed
        and child_run.state in {PlanningRunState.FEASIBLE, PlanningRunState.OPTIMAL}
    ):
        record.state = RapidBlockState.CANDIDATE_READY
        record.reason_codes = ["RAPIDBLOCK_CANDIDATE"]
    else:
        record.state = RapidBlockState.NO_CANDIDATE
        record.reason_codes = child_run.unscheduled_reason_codes.get(
            request.urgent_job.job_id, ["NO_CANDIDATE"]
        )
    cast(PlanningStore, planning_store).update_run(child_run)
    cast(PlanningStore, planning_store).save_rapidblock_request(record)
    _audit(
        record.request_id,
        record.state.value,
        request.actor,
        derived_snapshot_id=record.derived_snapshot_id,
        child_run_id=record.child_run_id,
    )
    return _response(record)


@router.get("/{request_id}", response_model=RapidBlockDetail)
def get_rapidblock_request(request_id: str) -> RapidBlockDetail:
    record = cast(PlanningStore, planning_store).get_rapidblock_request(request_id)
    if record is None:
        raise ApiError(404, "RAPIDBLOCK_REQUEST_NOT_FOUND", "RapidBlock request was not found")
    child_run = (
        cast(PlanningStore, planning_store).get_run(record.child_run_id)
        if record.child_run_id
        else None
    )
    validator = None
    candidate_status = None
    if child_run is not None:
        validator = ValidatorSummary(
            passed=child_run.validator_passed,
            issues=child_run.validator_issues,
            validated_at=child_run.validated_at,
        )
        candidate_status = child_run.state
    return RapidBlockDetail(
        **_response(record).model_dump(),
        actor=record.actor,
        actor_role=record.actor_role,
        justification=record.justification,
        source_reported_at=record.source_reported_at,
        urgent_job=record.urgent_job,
        changed_jobs=record.changed_jobs,
        preserved_locked_jobs=record.preserved_locked_jobs,
        validator=validator,
        candidate_plan_status=candidate_status,
    )
