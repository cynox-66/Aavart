from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from railniyojan.db.base import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    parent_snapshot_id: Mapped[str | None] = mapped_column(ForeignKey("snapshots.id"))
    derivation_type: Mapped[str | None] = mapped_column(String(30))
    derived_from_request_id: Mapped[str | None] = mapped_column(String(100))
    source_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    schema_version: Mapped[str] = mapped_column(String(30), nullable=False)
    raw_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SectionRecord(Base):
    __tablename__ = "sections"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    from_node: Mapped[str] = mapped_column(String(100), nullable=False)
    to_node: Mapped[str] = mapped_column(String(100), nullable=False)
    line: Mapped[str] = mapped_column(String(100), nullable=False)
    direction: Mapped[str] = mapped_column(String(20), nullable=False)


class AssetRecord(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    asset_type: Mapped[str] = mapped_column(String(100), nullable=False)
    section_id: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)


class ResourceRecord(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    availability: Mapped[str] = mapped_column(String(30), nullable=False)


class JobRecord(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    department: Mapped[str] = mapped_column(String(30), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(100), nullable=False)
    section_id: Mapped[str] = mapped_column(String(100), nullable=False)
    work_type: Mapped[str] = mapped_column(String(200), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_min_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_max_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    required_resources: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    allowed_windows: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PlanningWindowRecord(Base):
    __tablename__ = "windows"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    section_id: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    availability: Mapped[str] = mapped_column(String(30), nullable=False)


class TrainPathRecord(Base):
    __tablename__ = "train_paths"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    section_id: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ConflictGroupRecord(Base):
    __tablename__ = "conflict_groups"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("snapshots.id", ondelete="CASCADE"), primary_key=True
    )
    conflict_type: Mapped[str] = mapped_column(String(30), nullable=False)


class ConflictGroupMemberRecord(Base):
    __tablename__ = "conflict_group_members"
    __table_args__ = (
        ForeignKeyConstraint(
            ["conflict_group_id", "snapshot_id"],
            ["conflict_groups.id", "conflict_groups.snapshot_id"],
            ondelete="CASCADE",
        ),
    )

    conflict_group_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    member_id: Mapped[str] = mapped_column(String(100), primary_key=True)


class PlanningRun(Base):
    __tablename__ = "planning_runs"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshots.id"), nullable=False)
    parent_run_id: Mapped[str | None] = mapped_column(ForeignKey("planning_runs.id"))
    trigger_type: Mapped[str] = mapped_column(String(30), default="BASELINE", nullable=False)
    rapidblock_request_id: Mapped[str | None] = mapped_column(String(100))
    ruleset_version: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(30), nullable=False)
    solver_version: Mapped[str | None] = mapped_column(String(100))
    deterministic_seed: Mapped[int] = mapped_column(Integer, nullable=False)
    objective_value: Mapped[float | None] = mapped_column(Float)
    bound: Mapped[float | None] = mapped_column(Float)
    gap: Mapped[float | None] = mapped_column(Float)
    raw_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ScheduleItemRecord(Base):
    __tablename__ = "schedule_items"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("planning_runs.id", ondelete="CASCADE"), nullable=False
    )
    job_id: Mapped[str] = mapped_column(String(100), nullable=False)
    window_id: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reason_codes: Mapped[list[str]] = mapped_column(JSON, nullable=False)


class ValidatorResult(Base):
    __tablename__ = "validator_results"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("planning_runs.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    issues: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    validated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("planning_runs.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    reviewer: Mapped[str] = mapped_column(String(100), nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ExportRecord(Base):
    __tablename__ = "export_records"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("planning_runs.id"), nullable=False)
    format: Mapped[str] = mapped_column(String(10), nullable=False)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RapidBlockRequest(Base):
    __tablename__ = "rapidblock_requests"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    base_run_id: Mapped[str] = mapped_column(ForeignKey("planning_runs.id"), nullable=False)
    base_snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshots.id"), nullable=False)
    derived_snapshot_id: Mapped[str | None] = mapped_column(ForeignKey("snapshots.id"))
    child_run_id: Mapped[str | None] = mapped_column(ForeignKey("planning_runs.id"))
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(30), nullable=False)
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    source_reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    urgent_job_id: Mapped[str] = mapped_column(String(100), nullable=False)
    request_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    state: Mapped[str] = mapped_column(String(30), nullable=False)
    reason_codes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    changed_jobs: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    preserved_locked_jobs: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


Index("ix_windows_section_time", PlanningWindowRecord.section_id, PlanningWindowRecord.start_at)
Index("ix_jobs_snapshot", JobRecord.snapshot_id)
Index("ix_planning_runs_snapshot", PlanningRun.snapshot_id)
Index("ix_planning_runs_state", PlanningRun.state)
Index("ix_schedule_items_run", ScheduleItemRecord.run_id)
Index("ix_rapidblock_base_run_state", RapidBlockRequest.base_run_id, RapidBlockRequest.state)
