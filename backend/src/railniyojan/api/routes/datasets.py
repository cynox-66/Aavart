import csv
import io
import json
from typing import Any

from fastapi import APIRouter, Request

from railniyojan.api.validation import validate_dataset
from railniyojan.contracts.api import DatasetCounts, DatasetValidationResponse, ValidationIssue

router = APIRouter(prefix="/datasets", tags=["datasets"])

ENTITY_KEYS = {
    "section": "sections",
    "asset": "assets",
    "resource": "resources",
    "window": "windows",
    "job": "jobs",
    "train_path": "train_paths",
    "conflict_group": "conflict_groups",
}

LIST_FIELDS = {"required_resources", "allowed_windows", "member_ids"}
INT_FIELDS = {
    "capacity",
    "priority",
    "duration_minutes",
    "duration_min_minutes",
    "duration_max_minutes",
}


def _csv_value(field: str, value: str) -> Any:
    stripped = value.strip()
    if field in LIST_FIELDS:
        if not stripped:
            return []
        if stripped.startswith("["):
            parsed = json.loads(stripped)
            return parsed if isinstance(parsed, list) else [parsed]
        return [item.strip() for item in stripped.split("|") if item.strip()]
    if field in INT_FIELDS:
        return int(stripped)
    if stripped.lower() == "true":
        return True
    if stripped.lower() == "false":
        return False
    return stripped


def _csv_payload(text: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "schema_version": "1.0",
        "sections": [],
        "assets": [],
        "resources": [],
        "windows": [],
        "jobs": [],
        "train_paths": [],
        "conflict_groups": [],
        "metadata": {"source_format": "csv"},
    }
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "entity" not in reader.fieldnames:
        raise ValueError("CSV must include an entity column")
    for row in reader:
        entity = (row.get("entity") or "").strip().lower()
        key = ENTITY_KEYS.get(entity)
        if not key:
            raise ValueError(f"unsupported CSV entity: {entity}")
        item = {
            field: _csv_value(field, value)
            for field, value in row.items()
            if field != "entity" and value is not None and value.strip() != ""
        }
        payload[key].append(item)
    return payload


def _invalid_csv_response(message: str) -> DatasetValidationResponse:
    return DatasetValidationResponse(
        valid=False,
        snapshot_candidate_id=None,
        errors=[
            ValidationIssue(
                code="INVALID_INPUT",
                message=message,
                field="csv",
                row=None,
            )
        ],
        counts=DatasetCounts(jobs=0, windows=0, assets=0, sections=0, resources=0),
    )


@router.post("/validate", response_model=DatasetValidationResponse)
async def validate_dataset_endpoint(request: Request) -> DatasetValidationResponse:
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("text/csv"):
        try:
            payload = _csv_payload((await request.body()).decode())
        except (ValueError, json.JSONDecodeError) as error:
            return _invalid_csv_response(str(error))
        return validate_dataset(payload)

    payload = await request.json()
    if not isinstance(payload, dict):
        return _invalid_csv_response("JSON payload must be an object")
    return validate_dataset(payload)
