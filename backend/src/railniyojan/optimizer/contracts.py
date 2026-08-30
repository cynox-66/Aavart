from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from railniyojan.contracts.enums import PlanningRunState
from railniyojan.contracts.models import DatasetPayload, ScheduleItem


class OptimizerInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    run_id: str
    snapshot_id: str
    ruleset_version: str
    deterministic_seed: int
    time_budget_seconds: float = Field(gt=0)
    dataset: DatasetPayload
    fixed_items: list[ScheduleItem] = Field(default_factory=list)


class OptimizerOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    run_id: str
    state: PlanningRunState
    schedule_items: list[ScheduleItem]
    unscheduled_reason_codes: dict[str, list[str]]
    objective_value: float | None = None
    bound: float | None = None
    gap: float | None = None


class Planner(Protocol):
    def solve(self, planner_input: OptimizerInput) -> OptimizerOutput: ...
