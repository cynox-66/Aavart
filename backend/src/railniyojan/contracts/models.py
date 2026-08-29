from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from railniyojan.contracts.enums import Availability, JobStatus, ScheduleStatus

Identifier = Annotated[str, Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9._:-]+$")]


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


def _require_timezone(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timestamp must include an explicit timezone offset")
    return value


class Section(ContractModel):
    section_id: Identifier
    from_node: str = Field(min_length=1)
    to_node: str = Field(min_length=1)
    line: str = Field(min_length=1)
    direction: Literal["UP", "DOWN", "BOTH"]


class Asset(ContractModel):
    asset_id: Identifier
    asset_type: str = Field(min_length=1)
    section_id: Identifier
    status: Literal["AVAILABLE", "RESTRICTED", "UNAVAILABLE"]


class Resource(ContractModel):
    resource_id: Identifier
    resource_type: str = Field(min_length=1)
    capacity: int = Field(ge=1)
    availability: Availability


class PlanningWindow(ContractModel):
    window_id: Identifier
    start: datetime
    end: datetime
    section_id: Identifier
    availability: Availability

    _validate_start_timezone = field_validator("start")(_require_timezone)
    _validate_end_timezone = field_validator("end")(_require_timezone)

    @model_validator(mode="after")
    def validate_time_range(self) -> "PlanningWindow":
        if self.end <= self.start:
            raise ValueError("end must be after start")
        return self


class Job(ContractModel):
    job_id: Identifier
    department: Literal["TRACK", "SIGNAL", "ELECTRICAL", "CIVIL"]
    asset_id: Identifier
    section_id: Identifier
    work_type: str = Field(min_length=1)
    priority: int = Field(ge=0, le=100)
    duration_minutes: int = Field(gt=0)
    duration_min_minutes: int = Field(gt=0)
    duration_max_minutes: int = Field(gt=0)
    required_resources: list[Identifier] = Field(min_length=1)
    allowed_windows: list[Identifier] = Field(min_length=1)
    status: JobStatus

    @model_validator(mode="after")
    def validate_durations(self) -> "Job":
        if self.duration_min_minutes > self.duration_minutes:
            raise ValueError("duration_min_minutes must be <= duration_minutes")
        if self.duration_minutes > self.duration_max_minutes:
            raise ValueError("duration_minutes must be <= duration_max_minutes")
        return self


class TrainPath(ContractModel):
    train_path_id: Identifier
    section_id: Identifier
    start: datetime
    end: datetime

    _validate_start_timezone = field_validator("start")(_require_timezone)
    _validate_end_timezone = field_validator("end")(_require_timezone)

    @model_validator(mode="after")
    def validate_time_range(self) -> "TrainPath":
        if self.end <= self.start:
            raise ValueError("end must be after start")
        return self


class ConflictGroup(ContractModel):
    conflict_group_id: Identifier
    member_ids: list[Identifier] = Field(min_length=2)
    conflict_type: Literal["RESOURCE", "SECTION", "ISOLATION", "TRAIN_PATH"]


class DatasetPayload(ContractModel):
    schema_version: Literal["1.0"] = "1.0"
    sections: list[Section] = Field(min_length=1)
    assets: list[Asset] = Field(min_length=1)
    resources: list[Resource] = Field(min_length=1)
    windows: list[PlanningWindow] = Field(min_length=1)
    jobs: list[Job] = Field(min_length=1)
    train_paths: list[TrainPath] = Field(default_factory=list)
    conflict_groups: list[ConflictGroup] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ScheduleItem(ContractModel):
    job_id: Identifier
    window_id: Identifier
    start: datetime
    end: datetime
    status: ScheduleStatus
    reason_codes: list[str] = Field(min_length=1)
    locked: bool = False

    _validate_start_timezone = field_validator("start")(_require_timezone)
    _validate_end_timezone = field_validator("end")(_require_timezone)

    @model_validator(mode="after")
    def validate_time_range(self) -> "ScheduleItem":
        if self.end <= self.start:
            raise ValueError("end must be after start")
        return self
