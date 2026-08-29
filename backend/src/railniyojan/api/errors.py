from typing import Any

from fastapi.responses import JSONResponse

from railniyojan.contracts.api import ErrorResponse


class ApiError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.status_code = status_code
        self.error = ErrorResponse(code=code, message=message, details=details or {})


def api_error_handler(_: object, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.error.model_dump(mode="json"))
