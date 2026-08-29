from typing import Any, NoReturn

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from railniyojan.contracts.api import (
    ApprovalRequest,
    ErrorResponse,
    LockRequest,
    PlanningRunCreatedResponse,
    PlanningRunCreateRequest,
    ReplanRequest,
)

router = APIRouter(prefix="/planning-runs", tags=["planning-runs"])

foundation_response: dict[int | str, dict[str, Any]] = {
    501: {
        "model": ErrorResponse,
        "description": "Typed foundation route; implementation is assigned to its feature owner.",
    }
}


def _not_implemented(operation: str) -> NoReturn:
    error = ErrorResponse(
        code="FOUNDATION_NOT_IMPLEMENTED",
        message=f"{operation} is defined but not implemented in the foundation scaffold",
        details={"contract_status": "typed"},
    )
    raise FoundationRouteNotImplemented(error)


class FoundationRouteNotImplemented(Exception):
    def __init__(self, error: ErrorResponse) -> None:
        self.error = error


def foundation_exception_handler(_: object, exc: FoundationRouteNotImplemented) -> JSONResponse:
    return JSONResponse(status_code=501, content=exc.error.model_dump(mode="json"))


@router.post("", response_model=PlanningRunCreatedResponse, responses=foundation_response)
def create_planning_run(_: PlanningRunCreateRequest) -> PlanningRunCreatedResponse:
    return _not_implemented("planning run creation")


@router.get("/{run_id}", responses=foundation_response, response_model=None)
def get_planning_run(run_id: str) -> None:
    _not_implemented(f"planning run lookup for {run_id}")


@router.post("/{run_id}/lock", responses=foundation_response, response_model=None)
def lock_schedule_item(run_id: str, _: LockRequest) -> None:
    _not_implemented(f"schedule lock for {run_id}")


@router.post("/{run_id}/replan", responses=foundation_response, response_model=None)
def replan(run_id: str, _: ReplanRequest) -> None:
    _not_implemented(f"re-plan for {run_id}")


@router.post("/{run_id}/approve", responses=foundation_response, response_model=None)
def approve(run_id: str, _: ApprovalRequest) -> None:
    _not_implemented(f"approval for {run_id}")


@router.get("/{run_id}/export", responses=foundation_response, response_model=None)
def export(run_id: str) -> None:
    _not_implemented(f"export for {run_id}")
