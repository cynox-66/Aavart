import hashlib
import json
from collections.abc import Iterable
from typing import Any

from pydantic import ValidationError

from railniyojan.contracts.api import (
    DatasetCounts,
    DatasetValidationResponse,
    ValidationIssue,
)
from railniyojan.contracts.models import DatasetPayload


def _raw_count(payload: dict[str, Any], key: str) -> int:
    value = payload.get(key)
    return len(value) if isinstance(value, list) else 0


def _counts(payload: dict[str, Any]) -> DatasetCounts:
    return DatasetCounts(
        jobs=_raw_count(payload, "jobs"),
        windows=_raw_count(payload, "windows"),
        assets=_raw_count(payload, "assets"),
        sections=_raw_count(payload, "sections"),
        resources=_raw_count(payload, "resources"),
    )


def _pydantic_issues(error: ValidationError) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for item in error.errors(include_url=False):
        location = item.get("loc", ())
        field = ".".join(str(part) for part in location)
        row = next((part + 1 for part in location if isinstance(part, int)), None)
        issues.append(
            ValidationIssue(
                code="INVALID_INPUT",
                message=str(item["msg"]),
                field=field,
                row=row,
                details={"type": item["type"]},
            )
        )
    return issues


def _duplicate_issues(entity: str, identifiers: Iterable[str]) -> list[ValidationIssue]:
    seen: set[str] = set()
    issues: list[ValidationIssue] = []
    for index, identifier in enumerate(identifiers, start=1):
        if identifier in seen:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message=f"duplicate {entity} identifier: {identifier}",
                    field=f"{entity}.{index - 1}",
                    row=index,
                )
            )
        seen.add(identifier)
    return issues


def _reference_issues(dataset: DatasetPayload) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    section_ids = {item.section_id for item in dataset.sections}
    asset_by_id = {item.asset_id: item for item in dataset.assets}
    resource_ids = {item.resource_id for item in dataset.resources}
    window_by_id = {item.window_id: item for item in dataset.windows}
    job_ids = {item.job_id for item in dataset.jobs}
    train_path_ids = {item.train_path_id for item in dataset.train_paths}

    for index, asset in enumerate(dataset.assets, start=1):
        if asset.section_id not in section_ids:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message=f"unknown section reference: {asset.section_id}",
                    field=f"assets.{index - 1}.section_id",
                    row=index,
                )
            )

    for index, window in enumerate(dataset.windows, start=1):
        if window.section_id not in section_ids:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message=f"unknown section reference: {window.section_id}",
                    field=f"windows.{index - 1}.section_id",
                    row=index,
                )
            )

    for index, job in enumerate(dataset.jobs, start=1):
        prefix = f"jobs.{index - 1}"
        job_asset = asset_by_id.get(job.asset_id)
        if job_asset is None:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message=f"unknown asset reference: {job.asset_id}",
                    field=f"{prefix}.asset_id",
                    row=index,
                )
            )
        elif job_asset.section_id != job.section_id:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message="job and asset must belong to the same section",
                    field=f"{prefix}.section_id",
                    row=index,
                )
            )
        if job.section_id not in section_ids:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message=f"unknown section reference: {job.section_id}",
                    field=f"{prefix}.section_id",
                    row=index,
                )
            )
        for resource_id in job.required_resources:
            if resource_id not in resource_ids:
                issues.append(
                    ValidationIssue(
                        code="INVALID_INPUT",
                        message=f"unknown resource reference: {resource_id}",
                        field=f"{prefix}.required_resources",
                        row=index,
                    )
                )
        for window_id in job.allowed_windows:
            job_window = window_by_id.get(window_id)
            if job_window is None:
                issues.append(
                    ValidationIssue(
                        code="INVALID_INPUT",
                        message=f"unknown window reference: {window_id}",
                        field=f"{prefix}.allowed_windows",
                        row=index,
                    )
                )
            elif job_window.section_id != job.section_id:
                issues.append(
                    ValidationIssue(
                        code="INVALID_INPUT",
                        message=f"window {window_id} belongs to a different section",
                        field=f"{prefix}.allowed_windows",
                        row=index,
                    )
                )

    for index, train_path in enumerate(dataset.train_paths, start=1):
        if train_path.section_id not in section_ids:
            issues.append(
                ValidationIssue(
                    code="INVALID_INPUT",
                    message=f"unknown section reference: {train_path.section_id}",
                    field=f"train_paths.{index - 1}.section_id",
                    row=index,
                )
            )

    known_conflict_members = job_ids | resource_ids | section_ids | train_path_ids
    for index, conflict_group in enumerate(dataset.conflict_groups, start=1):
        for member_id in conflict_group.member_ids:
            if member_id not in known_conflict_members:
                issues.append(
                    ValidationIssue(
                        code="INVALID_INPUT",
                        message=f"unknown conflict-group member: {member_id}",
                        field=f"conflict_groups.{index - 1}.member_ids",
                        row=index,
                    )
                )

    return issues


def validate_dataset(payload: dict[str, Any]) -> DatasetValidationResponse:
    counts = _counts(payload)
    try:
        dataset = DatasetPayload.model_validate(payload)
    except ValidationError as error:
        return DatasetValidationResponse(
            valid=False,
            snapshot_candidate_id=None,
            errors=_pydantic_issues(error),
            counts=counts,
        )

    issues: list[ValidationIssue] = []
    issues.extend(_duplicate_issues("sections", (item.section_id for item in dataset.sections)))
    issues.extend(_duplicate_issues("assets", (item.asset_id for item in dataset.assets)))
    issues.extend(_duplicate_issues("resources", (item.resource_id for item in dataset.resources)))
    issues.extend(_duplicate_issues("windows", (item.window_id for item in dataset.windows)))
    issues.extend(_duplicate_issues("jobs", (item.job_id for item in dataset.jobs)))
    issues.extend(
        _duplicate_issues("train_paths", (item.train_path_id for item in dataset.train_paths))
    )
    issues.extend(
        _duplicate_issues(
            "conflict_groups", (item.conflict_group_id for item in dataset.conflict_groups)
        )
    )
    issues.extend(_reference_issues(dataset))

    if issues:
        return DatasetValidationResponse(
            valid=False,
            snapshot_candidate_id=None,
            errors=issues,
            counts=counts,
        )

    canonical = json.dumps(dataset.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(canonical.encode()).hexdigest()[:12].upper()
    return DatasetValidationResponse(
        valid=True,
        snapshot_candidate_id=f"SNAP-{digest}",
        errors=[],
        counts=counts,
    )
