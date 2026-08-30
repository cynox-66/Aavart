import hashlib
import json
from collections.abc import Iterable
from typing import Any

from pydantic import ValidationError

from railniyojan.contracts.api import (
    DatasetCounts,
    DatasetValidationResponse,
    SourceSummary,
    ValidationIssue,
)
from railniyojan.contracts.models import DatasetPayload
from railniyojan.planning.store import planning_store


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


def _source_summaries(payload: dict[str, Any]) -> list[SourceSummary]:
    metadata = payload.get("metadata")
    if not isinstance(metadata, dict):
        return []
    sources = metadata.get("source_provenance")
    if not isinstance(sources, list):
        return []
    summaries: list[SourceSummary] = []
    for item in sources:
        if not isinstance(item, dict):
            continue
        summaries.append(
            SourceSummary(
                source_id=str(item.get("source_id", "unknown")),
                department=str(item.get("department", "unknown")),
                status=str(item.get("status", "unknown")),
                file_name=item.get("file_name") if isinstance(item.get("file_name"), str) else None,
                job_count=int(item.get("job_count", 0) or 0),
                warning_count=int(item.get("warning_count", 0) or 0),
            )
        )
    return summaries


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
    source_summaries = _source_summaries(payload)
    try:
        dataset = DatasetPayload.model_validate(payload)
    except ValidationError as error:
        return DatasetValidationResponse(
            valid=False,
            snapshot_candidate_id=None,
            source_hash=None,
            errors=_pydantic_issues(error),
            counts=counts,
            source_summaries=source_summaries,
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
            source_hash=None,
            errors=issues,
            counts=counts,
            source_summaries=source_summaries,
        )

    canonical = json.dumps(dataset.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    source_hash = hashlib.sha256(canonical.encode()).hexdigest()
    digest = source_hash[:12].upper()
    snapshot_id = f"SNAP-{digest}"
    planning_store.register_snapshot(snapshot_id, source_hash, dataset)
    return DatasetValidationResponse(
        valid=True,
        snapshot_candidate_id=snapshot_id,
        source_hash=source_hash,
        errors=[],
        counts=counts,
        source_summaries=source_summaries,
    )
