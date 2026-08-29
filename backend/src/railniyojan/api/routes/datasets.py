from typing import Annotated, Any

from fastapi import APIRouter, Body

from railniyojan.api.validation import validate_dataset
from railniyojan.contracts.api import DatasetValidationResponse

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/validate", response_model=DatasetValidationResponse)
def validate_dataset_endpoint(
    payload: Annotated[dict[str, Any], Body()],
) -> DatasetValidationResponse:
    return validate_dataset(payload)
