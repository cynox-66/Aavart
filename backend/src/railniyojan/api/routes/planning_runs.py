from __future__ import annotations

import csv
import hashlib
import io
import json
from datetime import UTC, datetime, timedelta
from typing import cast

from fastapi import APIRouter
from fastapi.responses import Response

from railniyojan.api.errors import ApiError
from railniyojan.contracts.api import (
    ApprovalRequest,
    ApprovalResponse,
    ApprovalSummary,
    JobContext,
    LockRequest,
    LockResponse,
    PlanningRunCreatedResponse,
    PlanningRunCreateRequest,
    PlanningRunDetail,
    PlanningRunSummary,
    ReplanRequest,
    UnscheduledJob,
    ValidatorSummary,
)
from railniyojan.contracts.enums import PlanningRunState, ScheduleStatus
from railniyojan.contracts.models import DatasetPayload, ScheduleItem
from railniyojan.optimizer.contracts import OptimizerInput
from railniyojan.optimizer.planner import DeterministicPlanner
from railniyojan.optimizer.validator import validate_schedule
from railniyojan.planning.ai import LocalHeuristicEstimator
from railniyojan.planning.kpis import calculate_kpis
from railniyojan.planning.store import (
    AuditEventRecord,
    ExportRecord,
    PlanningIntentRecord,
    PlanningStore,
    RunRecord,
    RunSummaryRecord,
    SnapshotRecord,
    planning_store,
)

router = APIRouter(prefix="/planning-runs", tags=["planning-runs"])
RULESET_VERSION = "Demo Ruleset v1"
planner = DeterministicPlanner()
estimator = LocalHeuristicEstimator()


def _snapshot_or_404(snapshot_id: str) -> SnapshotRecord:
    snapshot = cast(PlanningStore, planning_store).get_snapshot(snapshot_id)
    if snapshot is None:
        raise ApiError(404, "SNAPSHOT_NOT_FOUND", "Validate the dataset before creating a run")
    return snapshot


def _run_or_404(run_id: str) -> RunRecord:
    run = cast(PlanningStore, planning_store).get_run(run_id)
    if run is None:
        raise ApiError(404, "RUN_NOT_FOUND", f"Planning run {run_id} was not found")
    return run


def _created(run: RunRecord) -> PlanningRunCreatedResponse:
    return PlanningRunCreatedResponse(
        run_id=run.run_id,
        state=run.state,
        snapshot_id=run.snapshot_id,
        ruleset_version=run.ruleset_version,
        created_at=run.created_at,
        status_url=f"/planning-runs/{run.run_id}",
    )


def _execute_run(
    snapshot: SnapshotRecord,
    ruleset_version: str,
    *,
    parent_run_id: str | None = None,
    intent_id: str | None = None,
    fixed_items: list[ScheduleItem] | None = None,
    required_locked: list[ScheduleItem] | None = None,
    trigger_type: str = "BASELINE",
    rejected_intent_edits: list[dict[str, object]] | None = None,
) -> RunRecord:
    run_id = planning_store.next_run_id()
    created_at = datetime.now(UTC)
    planned_dataset, ai_estimates = estimator.estimate(snapshot.dataset)
    output = planner.solve(
        OptimizerInput(
            run_id=run_id,
            snapshot_id=snapshot.snapshot_id,
            ruleset_version=ruleset_version,
            deterministic_seed=26027,
            dataset=planned_dataset,
            fixed_items=fixed_items or [],
        )
    )
    issues = validate_schedule(
        planned_dataset,
        output.schedule_items,
        required_locked=required_locked or [],
    )
    if issues:
        output.state = PlanningRunState.INVALID
    now = datetime.now(UTC)
    scheduled = {item.job_id for item in output.schedule_items}
    changes = {
        job.job_id: ("SCHEDULED" if job.job_id in scheduled else "REJECTED")
        for job in planned_dataset.jobs
    }
    run = RunRecord(
        run_id=run_id,
        snapshot_id=snapshot.snapshot_id,
        ruleset_version=ruleset_version,
        state=output.state,
        created_at=created_at,
        completed_at=now,
        schedule_items=output.schedule_items,
        unscheduled_reason_codes=output.unscheduled_reason_codes,
        validator_passed=not issues,
        validator_issues=issues,
        validated_at=now,
        parent_run_id=parent_run_id,
        intent_id=intent_id,
        trigger_type=trigger_type,
        changes=changes,
        kpis=calculate_kpis(planned_dataset, output.schedule_items),
        ai_estimates=ai_estimates,
        rejected_intent_edits=rejected_intent_edits or [],
    )
    return cast(PlanningStore, planning_store).save_run(run)


def _detail(run: RunRecord) -> PlanningRunDetail:
    snapshot = _snapshot_or_404(run.snapshot_id)
    metadata = snapshot.dataset.metadata if isinstance(snapshot.dataset.metadata, dict) else {}
    planning_horizon = metadata.get("horizon")
    intent_record = (
        cast(PlanningStore, planning_store).get_planning_intent(run.intent_id)
        if run.intent_id
        else None
    )
    export_ready = (
        run.approval is not None
        and run.state in {PlanningRunState.FEASIBLE, PlanningRunState.OPTIMAL}
        and run.validator_passed
        and snapshot.status == "VALID"
    )
    return PlanningRunDetail(
        run_id=run.run_id,
        state=run.state,
        snapshot_id=run.snapshot_id,
        snapshot_status=snapshot.status,
        ruleset_version=run.ruleset_version,
        created_at=run.created_at,
        completed_at=run.completed_at,
        parent_run_id=run.parent_run_id,
        schedule_items=run.schedule_items,
        unscheduled_jobs=[
            UnscheduledJob(job_id=job_id, reason_codes=codes)
            for job_id, codes in sorted(run.unscheduled_reason_codes.items())
        ],
        jobs=[
            JobContext(
                job_id=job.job_id,
                department=job.department,
                asset_id=job.asset_id,
                section_id=job.section_id,
                work_type=job.work_type,
                priority=job.priority,
                duration_minutes=job.duration_minutes,
                required_resources=job.required_resources,
                allowed_windows=job.allowed_windows,
            )
            for job in snapshot.dataset.jobs
        ],
        validator=ValidatorSummary(
            passed=run.validator_passed,
            issues=run.validator_issues,
            validated_at=run.validated_at,
        ),
        approval=run.approval,
        changes=run.changes,
        export_ready=export_ready,
        kpis=run.kpis or calculate_kpis(snapshot.dataset, run.schedule_items),
        ai_estimates=run.ai_estimates,
        planning_horizon=planning_horizon if planning_horizon in {"WEEKLY", "MONTHLY"} else None,
        horizon_start=metadata.get("horizon_start"),
        horizon_end=metadata.get("horizon_end"),
        intent_id=run.intent_id,
        intent=intent_record.payload if intent_record else None,
        rejected_intent_edits=run.rejected_intent_edits,
    )


def _summary(record: RunSummaryRecord) -> PlanningRunSummary:
    return PlanningRunSummary(
        run_id=record.run_id,
        state=record.state,
        snapshot_id=record.snapshot_id,
        ruleset_version=record.ruleset_version,
        created_at=record.created_at,
        completed_at=record.completed_at,
        parent_run_id=record.parent_run_id,
        trigger_type=record.trigger_type,
        total_job_count=record.total_job_count,
        scheduled_job_count=record.scheduled_job_count,
        validator_passed=record.validator_passed,
        approval=record.approval,
        kpis=record.kpis,
        planning_horizon=record.planning_horizon if record.planning_horizon in {"WEEKLY", "MONTHLY"} else None,
        horizon_start=record.horizon_start,
        horizon_end=record.horizon_end,
    )


def _audit(
    entity_type: str, entity_id: str, event_type: str, actor: str, **metadata: object
) -> None:
    planning_store.add_audit_event(
        AuditEventRecord(
            event_id=planning_store.next_event_id(),
            entity_type=entity_type,
            entity_id=entity_id,
            event_type=event_type,
            actor=actor,
            metadata=metadata,
        )
    )


def _derive_intent_snapshot(
    parent: RunRecord,
    snapshot: SnapshotRecord,
    request: ReplanRequest,
    intent_id: str,
) -> tuple[SnapshotRecord, list[ScheduleItem], list[ScheduleItem], list[dict[str, object]]]:
    dataset = snapshot.dataset
    jobs = {job.job_id: job for job in dataset.jobs}
    windows = {window.window_id: window for window in dataset.windows}
    parent_items = {item.job_id: item for item in parent.schedule_items}
    fixed_items = [
        item.model_copy(deep=True)
        for item in parent.schedule_items
        if item.locked or item.job_id in set(request.locked_job_ids)
    ]
    fixed_by_job = {item.job_id: item for item in fixed_items}
    rejected: list[dict[str, object]] = []
    excluded_job_ids: set[str] = set()

    for job_id in request.exclusions:
        if job_id not in jobs:
            rejected.append({"type": "EXCLUSION", "job_id": job_id, "code": "UNKNOWN_JOB"})
            continue
        if job_id in fixed_by_job:
            rejected.append({"type": "EXCLUSION", "job_id": job_id, "code": "LOCKED_JOB_CANNOT_BE_EXCLUDED"})
            continue
        excluded_job_ids.add(job_id)

    for move in request.moves:
        job = jobs.get(move.job_id)
        window = windows.get(move.target_window_id)
        if job is None:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "UNKNOWN_JOB"})
            continue
        if move.job_id in excluded_job_ids:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "JOB_EXCLUDED"})
            continue
        if move.job_id in fixed_by_job and fixed_by_job[move.job_id].window_id != move.target_window_id:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "LOCKED_JOB_CANNOT_MOVE"})
            continue
        if window is None:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "UNKNOWN_WINDOW"})
            continue
        if move.target_window_id not in job.allowed_windows:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "WINDOW_NOT_ALLOWED"})
            continue
        if window.section_id != job.section_id:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "WINDOW_SECTION_MISMATCH"})
            continue
        end = window.start + timedelta(minutes=job.duration_minutes)
        if end > window.end:
            rejected.append({"type": "MOVE", "job_id": move.job_id, "code": "DURATION_EXCEEDS_WINDOW"})
            continue
        fixed_by_job[move.job_id] = ScheduleItem(
            job_id=move.job_id,
            window_id=move.target_window_id,
            start=window.start,
            end=end,
            status=ScheduleStatus.LOCKED,
            reason_codes=["INTENT_MOVE"],
            locked=True,
        )

    kept_jobs = [job for job in dataset.jobs if job.job_id not in excluded_job_ids]
    kept_job_ids = {job.job_id for job in kept_jobs}
    conflict_groups = []
    for group in dataset.conflict_groups:
        members = [member for member in group.member_ids if member not in excluded_job_ids]
        if len(members) >= 2:
            conflict_groups.append(group.model_copy(update={"member_ids": members}))

    fixed = [item for item in fixed_by_job.values() if item.job_id in kept_job_ids]
    derived_payload = dataset.model_dump(mode="json")
    derived_payload["jobs"] = [job.model_dump(mode="json") for job in kept_jobs]
    derived_payload["conflict_groups"] = [group.model_dump(mode="json") for group in conflict_groups]
    derived_payload["metadata"] = {
        **dataset.metadata,
        "planning_intent": {
            "intent_id": intent_id,
            "base_run_id": parent.run_id,
            "moves": [move.model_dump(mode="json") for move in request.moves],
            "exclusions": sorted(excluded_job_ids),
            "rejected_edits": rejected,
        },
    }
    derived_snapshot_id, source_hash = derive_snapshot_id(derived_payload)
    derived_snapshot = planning_store.register_snapshot(
        derived_snapshot_id,
        source_hash,
        DatasetPayload.model_validate(derived_payload),
        parent_snapshot_id=snapshot.snapshot_id,
        derivation_type="PLANNING_INTENT",
        derived_from_request_id=intent_id,
        created_by=request.actor,
    )
    return derived_snapshot, fixed, fixed, rejected


@router.post("", response_model=PlanningRunCreatedResponse, status_code=201)
def create_planning_run(request: PlanningRunCreateRequest) -> PlanningRunCreatedResponse:
    snapshot = _snapshot_or_404(request.snapshot_id)
    if snapshot.status != "VALID":
        raise ApiError(409, "STALE_SNAPSHOT", "The snapshot is not valid for planning")
    if request.ruleset_version != RULESET_VERSION:
        raise ApiError(400, "INVALID_INPUT", f"ruleset_version must be {RULESET_VERSION}")
    return _created(_execute_run(snapshot, request.ruleset_version))


@router.get("", response_model=list[PlanningRunSummary])
def list_planning_runs() -> list[PlanningRunSummary]:
    """Archive of every persisted run, newest first."""
    return [_summary(record) for record in cast(PlanningStore, planning_store).list_runs()]


@router.get("/{run_id}", response_model=PlanningRunDetail)
def get_planning_run(run_id: str) -> PlanningRunDetail:
    return _detail(_run_or_404(run_id))


@router.post("/{run_id}/lock", response_model=LockResponse)
def lock_schedule_item(run_id: str, request: LockRequest) -> LockResponse:
    run = _run_or_404(run_id)
    if run.state not in {PlanningRunState.FEASIBLE, PlanningRunState.OPTIMAL}:
        raise ApiError(409, "INVALID_RUN_STATE", "Only a feasible schedule item can be locked")
    item = next((item for item in run.schedule_items if item.job_id == request.job_id), None)
    if item is None:
        raise ApiError(404, "SCHEDULE_ITEM_NOT_FOUND", "The job is not scheduled in this run")
    item.locked = True
    item.status = ScheduleStatus.LOCKED
    item.reason_codes = ["LOCK_PRESERVED"]
    planning_store.update_run(run)
    _audit("planning_run", run_id, "LOCK_CREATED", "planner", job_id=request.job_id)
    return LockResponse(
        run_id=run_id,
        job_id=request.job_id,
        locked=True,
        reason_codes=item.reason_codes,
    )


@router.post("/{run_id}/replan", response_model=PlanningRunCreatedResponse, status_code=201)
def replan(run_id: str, request: ReplanRequest) -> PlanningRunCreatedResponse:
    parent = _run_or_404(run_id)
    snapshot = _snapshot_or_404(parent.snapshot_id)
    if snapshot.status != "VALID":
        raise ApiError(409, "STALE_SNAPSHOT", "A stale or invalid snapshot cannot be re-planned")
    jobs = {job.job_id: job for job in snapshot.dataset.jobs}
    move_job_ids = {move.job_id for move in request.moves}
    affected_sections = set(request.affected_section_ids) | {
        jobs[job_id].section_id for job_id in set(request.exclusions) | move_job_ids if job_id in jobs
    }
    affected_windows = set(request.affected_window_ids) | {move.target_window_id for move in request.moves}
    known_sections = {section.section_id for section in snapshot.dataset.sections}
    known_windows = {window.window_id for window in snapshot.dataset.windows}
    if not affected_sections <= known_sections or not affected_windows <= known_windows:
        raise ApiError(400, "OUTSIDE_PLANNING_SCOPE", "Re-plan scope is outside the snapshot")
    if not affected_sections and not affected_windows and not request.locked_job_ids:
        raise ApiError(400, "EMPTY_INTENT", "Re-plan requires a move, exclusion, lock, or affected scope")

    intent_id = planning_store.next_intent_id()
    intent_payload = {
        "affected_section_ids": sorted(affected_sections),
        "affected_window_ids": sorted(affected_windows),
        "moves": [move.model_dump(mode="json") for move in request.moves],
        "exclusions": request.exclusions,
        "locked_job_ids": request.locked_job_ids,
    }
    derived_snapshot, intent_fixed, required_locked, rejected = _derive_intent_snapshot(
        parent, snapshot, request, intent_id
    )
    planning_store.save_planning_intent(
        PlanningIntentRecord(
            intent_id=intent_id,
            base_run_id=parent.run_id,
            actor=request.actor,
            reason=request.reason,
            payload=intent_payload,
            rejected_edits=rejected,
        )
    )
    fixed = [
        item.model_copy(deep=True)
        for item in parent.schedule_items
        if item.locked
        or (
            item.job_id in jobs
            and jobs[item.job_id].section_id not in affected_sections
            and item.window_id not in affected_windows
        )
    ]
    fixed_by_job = {item.job_id: item for item in fixed}
    for item in intent_fixed:
        fixed_by_job[item.job_id] = item
    child = _execute_run(
        derived_snapshot,
        parent.ruleset_version,
        parent_run_id=parent.run_id,
        intent_id=intent_id,
        fixed_items=list(fixed_by_job.values()),
        required_locked=required_locked,
        trigger_type="PLANNING_INTENT",
        rejected_intent_edits=rejected,
    )
    old = {item.job_id: item for item in parent.schedule_items}
    new = {item.job_id: item for item in child.schedule_items}
    child.changes = {}
    for job in derived_snapshot.dataset.jobs:
        before = old.get(job.job_id)
        after = new.get(job.job_id)
        if before is not None and after is not None:
            child.changes[job.job_id] = "PRESERVED" if before == after else "CHANGED"
        elif after is not None:
            child.changes[job.job_id] = "SCHEDULED"
        else:
            child.changes[job.job_id] = "REJECTED"
    for job_id in request.exclusions:
        if job_id in jobs and not any(item.get("job_id") == job_id for item in rejected):
            child.changes[job_id] = "REJECTED"
    planning_store.update_run(child)
    _audit("planning_intent", intent_id, "INTENT_APPLIED", request.actor, child_run_id=child.run_id)
    return _created(child)


@router.post("/{run_id}/approve", response_model=ApprovalResponse)
def approve(run_id: str, request: ApprovalRequest) -> ApprovalResponse:
    run = _run_or_404(run_id)
    snapshot = _snapshot_or_404(run.snapshot_id)
    if run.approval is not None:
        raise ApiError(409, "ALREADY_APPROVED", "This run already has an approval")
    if snapshot.status != "VALID":
        raise ApiError(409, "STALE_SNAPSHOT", "A stale or invalid snapshot cannot be approved")
    if run.state not in {PlanningRunState.FEASIBLE, PlanningRunState.OPTIMAL}:
        raise ApiError(409, "INVALID_RUN_STATE", "Only a feasible validated run can be approved")
    if not run.validator_passed:
        raise ApiError(409, "SAFETY_VALIDATION_FAILED", "Independent validation did not pass")
    approval = ApprovalSummary(
        reviewer=request.reviewer,
        comment=request.comment,
        approved_at=datetime.now(UTC),
        run_id=run.run_id,
        snapshot_id=run.snapshot_id,
        ruleset_version=run.ruleset_version,
    )
    run.approval = approval
    planning_store.update_run(run)
    _audit("planning_run", run.run_id, "APPROVED", request.reviewer)
    return ApprovalResponse(run_id=run.run_id, approved=True, approval=approval)


@router.get("/{run_id}/export")
def export(run_id: str) -> Response:
    run = _run_or_404(run_id)
    detail = _detail(run)
    if not detail.export_ready or run.approval is None:
        raise ApiError(409, "EXPORT_BLOCKED", "Export requires a valid, safe, human-approved run")
    planning_store.add_export(
        ExportRecord(
            export_id=planning_store.next_export_id(),
            run_id=run.run_id,
            format="csv",
            created_by=run.approval.reviewer,
        )
    )
    _audit("planning_run", run.run_id, "EXPORTED", run.approval.reviewer, format="csv")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "run_id", "snapshot_id", "ruleset_version", "reviewer", "approved_at",
            "job_id", "window_id", "start", "end", "status", "reason_codes",
        ]
    )
    for item in run.schedule_items:
        writer.writerow(
            [
                run.run_id, run.snapshot_id, run.ruleset_version, run.approval.reviewer,
                run.approval.approved_at.isoformat(), item.job_id, item.window_id,
                item.start.isoformat(), item.end.isoformat(), item.status,
                "|".join(item.reason_codes),
            ]
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{run_id}.csv"'},
    )


def derive_snapshot_id(payload: object) -> tuple[str, str]:
    canonical = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    source_hash = hashlib.sha256(canonical.encode()).hexdigest()
    return f"SNAP-{source_hash[:12].upper()}", source_hash
