from enum import StrEnum


class Availability(StrEnum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"


class JobStatus(StrEnum):
    UNSCHEDULED = "UNSCHEDULED"
    SCHEDULED = "SCHEDULED"
    LOCKED = "LOCKED"
    REJECTED = "REJECTED"
    INVALID = "INVALID"


class ScheduleStatus(StrEnum):
    SCHEDULED = "SCHEDULED"
    LOCKED = "LOCKED"
    REJECTED = "REJECTED"


class PlanningRunState(StrEnum):
    """Terminal states only.

    Planning is synchronous: POST /planning-runs solves before it responds, so a
    run is never observable in flight. QUEUED and RUNNING existed here but were
    assigned nowhere, which advertised an execution model the system did not
    have. Reintroduce them together with a real queue, not before - see
    docs/architecture.md, "Execution model".
    """

    FEASIBLE = "FEASIBLE"
    OPTIMAL = "OPTIMAL"
    INFEASIBLE = "INFEASIBLE"
    TIMEOUT = "TIMEOUT"
    INVALID = "INVALID"
    FAILED = "FAILED"


class RapidBlockState(StrEnum):
    SUBMITTED = "SUBMITTED"
    VALIDATING = "VALIDATING"
    REJECTED = "REJECTED"
    PLANNING = "PLANNING"
    CANDIDATE_READY = "CANDIDATE_READY"
    NO_CANDIDATE = "NO_CANDIDATE"

