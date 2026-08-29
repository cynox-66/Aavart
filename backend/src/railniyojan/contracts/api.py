from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from railniyojan.contracts.enums import PlanningRunState


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ValidationIssue(ApiModel):
    code: str
    message: str
    field: str
    row: int | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class DatasetCounts(ApiModel):
    jobs: int = 0
    windows: int = 0
    assets: int = 0
    sections: int = 0
    resources: int = 0


class DatasetValidationResponse(ApiModel):
    valid: bool
    snapshot_candidate_id: str | None
    errors: list[ValidationIssue]
    counts: DatasetCounts


class PlanningRunCreateRequest(ApiModel):
    snapshot_id: str = Field(min_length=1)
    ruleset_version: str = Field(min_length=1)


class PlanningRunCreatedResponse(ApiModel):
    run_id: str
    state: PlanningRunState
    snapshot_id: str
    ruleset_version: str
    created_at: datetime
    status_url: str


class LockRequest(ApiModel):
    job_id: str = Field(min_length=1)
    reason: str = Field(min_length=1)


class ReplanRequest(ApiModel):
    affected_section_ids: list[str] = Field(min_length=1)
    affected_window_ids: list[str] = Field(min_length=1)


class ApprovalRequest(ApiModel):
    reviewer: str = Field(min_length=1)
    comment: str = Field(min_length=1)


class ErrorResponse(ApiModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
