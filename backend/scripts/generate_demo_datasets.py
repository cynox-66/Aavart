"""Generate deterministic, cross-referenced RailNiyojan demo data.

The generated data is a controlled scenario. It is not Railway-authorized data.
Each corridor is emitted as an independent canonical DatasetPayload because the
current planner contract scopes a run to one corridor.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

IST = timedelta(hours=5, minutes=30)
START = datetime(2026, 9, 7, 0, 0, tzinfo=timezone(IST))


def stamp(value: datetime) -> str:
    return value.isoformat()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n")


def build_corridor(corridor_no: int, *, station_count: int = 12) -> dict[str, Any]:
    prefix = f"C{corridor_no}"
    corridor_id = f"CORRIDOR-{prefix}"
    stations = [
        {
            "station_id": f"STN-{prefix}-{index:02d}",
            "code": f"{prefix}{index:02d}",
            "name": f"{('Narmada' if corridor_no == 1 else 'Sahyadri')} Junction {index:02d}",
            "sequence": index,
            "latitude": round(22.60 + corridor_no * 0.18 + index * 0.055, 6),
            "longitude": round(75.75 + corridor_no * 0.22 + index * 0.065, 6),
            "source_class": "CONTROLLED-SCENARIO",
        }
        for index in range(1, station_count + 1)
    ]

    sections = []
    for index in range(1, station_count):
        sections.append(
            {
                "section_id": f"SEC-{prefix}-{index:02d}",
                "from_node": stations[index - 1]["code"],
                "to_node": stations[index]["code"],
                "line": "UP/DOWN DOUBLE LINE" if corridor_no == 1 else "SINGLE LINE",
                "direction": "BOTH" if corridor_no == 1 else ("UP" if index % 2 else "DOWN"),
                "chainage_start_km": (corridor_no - 1) * 100 + (index - 1) * 8.4,
                "chainage_end_km": (corridor_no - 1) * 100 + index * 8.4,
                "signalling_system": "ABSOLUTE_BLOCK" if corridor_no == 1 else "TOKENLESS_BLOCK",
                "mapping_status": "CONTROLLED-SCENARIO",
                "mapping_source": "DEMO-SECTIONAL-DIAGRAM-v1",
                "effective_from": "2026-09-01",
            }
        )

    assets = []
    for index, section in enumerate(sections, start=1):
        for kind in ("TRACK", "SIGNAL", "OHE"):
            assets.append(
                {
                    "asset_id": f"AST-{prefix}-{index:02d}-{kind}",
                    "asset_type": kind,
                    "section_id": section["section_id"],
                    "status": (
                        "AVAILABLE"
                        if not (kind == "OHE" and corridor_no == 2 and index % 5 == 0)
                        else "RESTRICTED"
                    ),
                    "source_class": "CONTROLLED-SCENARIO",
                }
            )

    resources = []
    for index in range(1, 13):
        resource_type = ("TRACK_TEAM" if index <= 5 else "SIGNAL_TEAM" if index <= 8 else "MACHINE")
        resources.append(
            {
                "resource_id": f"RES-{prefix}-{index:02d}",
                "resource_type": resource_type,
                "capacity": 1,
                "availability": "AVAILABLE",
                "source_class": "CONTROLLED-SCENARIO",
            }
        )

    windows = []
    for section_index, section in enumerate(sections, start=1):
        for slot, (start_hour, end_hour) in enumerate(((8, 10), (12, 14), (16, 18)), start=1):
            start = START + timedelta(days=section_index % 3, hours=start_hour)
            end = START + timedelta(days=section_index % 3, hours=end_hour)
            windows.append(
                {
                    "window_id": f"WIN-{prefix}-{section_index:02d}-{slot}",
                    "start": stamp(start),
                    "end": stamp(end),
                    "section_id": section["section_id"],
                    "availability": (
                        "AVAILABLE" if slot != 3 or section_index % 4 else "UNAVAILABLE"
                    ),
                    "source_class": "CONTROLLED-SCENARIO",
                }
            )

    # Every window that belongs to a section, in slot order. A maintenance job is
    # eligible for any possession of the section it sits in - eligibility is a
    # compatibility fact, while availability is a separate operational one, so
    # unavailable slots stay listed and the solver skips them.
    windows_by_section: dict[str, list[str]] = {}
    for window in windows:
        windows_by_section.setdefault(window["section_id"], []).append(window["window_id"])

    train_paths = []
    for service in range(1, 25):
        day = service % 7
        for section_index, section in enumerate(sections, start=1):
            base = START + timedelta(days=day, hours=6 + (service % 5), minutes=section_index * 6)
            train_paths.append(
                {
                    "train_path_id": f"TP-{prefix}-{service:02d}-{section_index:02d}",
                    "section_id": section["section_id"],
                    "start": stamp(base),
                    "end": stamp(base + timedelta(minutes=12 if corridor_no == 1 else 18)),
                    "train_number": f"{12000 + corridor_no * 100 + service:05d}",
                    "service_date": (START + timedelta(days=day)).date().isoformat(),
                    "source_class": "PUBLIC",
                    "source_provider": "RailRadar",
                    "mapping_status": "CONTROLLED-SCENARIO",
                }
            )

    jobs = []
    work_types = (
        "rail inspection",
        "tamping",
        "signal testing",
        "OHE inspection",
        "drain cleaning",
    )
    for index in range(1, 91):
        section_index = (index - 1) % len(sections) + 1
        section_id = sections[section_index - 1]["section_id"]
        kind = work_types[(index + corridor_no) % len(work_types)]
        asset_kind = "OHE" if "OHE" in kind else "SIGNAL" if "signal" in kind else "TRACK"
        resource_index = (index - 1) % 12 + 1
        duration = 45 + (index % 4) * 15
        jobs.append(
            {
                "job_id": f"JOB-{prefix}-{index:03d}",
                "department": (
                    "ELECTRICAL"
                    if asset_kind == "OHE"
                    else "SIGNAL"
                    if asset_kind == "SIGNAL"
                    else "TRACK"
                ),
                "asset_id": f"AST-{prefix}-{section_index:02d}-{asset_kind}",
                "section_id": section_id,
                "work_type": kind,
                "priority": 40 + (index * 13) % 61,
                "duration_minutes": duration,
                "duration_min_minutes": max(30, duration - 15),
                "duration_max_minutes": duration + 30,
                "required_resources": [f"RES-{prefix}-{resource_index:02d}"],
                "allowed_windows": list(windows_by_section[section_id]),
                "status": "UNSCHEDULED",
                "source_class": "CONTROLLED-SCENARIO",
            }
        )

    isolation_zones = []
    block_rules = []
    permits = []
    for index, section in enumerate(sections, start=1):
        zone_id = f"ISO-{prefix}-{index:02d}"
        isolation_zones.append(
            {
                "isolation_zone_id": zone_id,
                "section_id": section["section_id"],
                "isolation_type": "OHE_EARTHED" if index % 2 else "TRACK_PROTECTION",
                "responsible_department": "ELECTRICAL" if index % 2 else "ENGINEERING",
                "source_class": "CONTROLLED-SCENARIO",
            }
        )
        for block_type in ("TRAFFIC", "POWER"):
            rule_id = f"RULE-{prefix}-{index:02d}-{block_type}"
            block_rules.append(
                {
                    "block_rule_id": rule_id,
                    "section_id": section["section_id"],
                    "block_type": block_type,
                    "minimum_buffer_minutes": 10 if block_type == "TRAFFIC" else 15,
                    "required_authority": (
                        "SECTION_CONTROLLER"
                        if block_type == "TRAFFIC"
                        else "TRACTION_POWER_CONTROLLER"
                    ),
                    "eligible_departments": (
                        ["TRACK", "SIGNAL"] if block_type == "TRAFFIC" else ["ELECTRICAL"]
                    ),
                    "source_class": "CONTROLLED-SCENARIO",
                }
            )
    for index, job in enumerate(jobs, start=1):
        block_type = "POWER" if job["department"] == "ELECTRICAL" else "TRAFFIC"
        permits.append(
            {
                "permit_id": f"PTW-{prefix}-{index:03d}",
                "job_id": job["job_id"],
                "section_id": job["section_id"],
                "block_rule_id": f"RULE-{prefix}-{int(job['section_id'][-2:]):02d}-{block_type}",
                "permit_type": (
                    "POWER_PERMIT_TO_WORK"
                    if block_type == "POWER"
                    else "TRAFFIC_BLOCK_REQUEST"
                ),
                "status": "PENDING" if index % 4 else "EXPIRED",
                "issuer_role": (
                    "TRACTION_POWER_CONTROLLER"
                    if block_type == "POWER"
                    else "SECTION_CONTROLLER"
                ),
                "source_class": "CONTROLLED-SCENARIO",
            }
        )

    conflict_groups = [
        {
            "conflict_group_id": f"ISO-GROUP-{prefix}-{index:02d}",
            "member_ids": [
                f"JOB-{prefix}-{index:03d}",
                f"JOB-{prefix}-{index + 12:03d}",
            ],
            "conflict_type": "ISOLATION",
        }
        for index in range(1, 13)
    ]
    canonical_sections = [
        {key: item[key] for key in ("section_id", "from_node", "to_node", "line", "direction")}
        for item in sections
    ]
    canonical_assets = [
        {key: item[key] for key in ("asset_id", "asset_type", "section_id", "status")}
        for item in assets
    ]
    canonical_resources = [
        {
            key: item[key]
            for key in ("resource_id", "resource_type", "capacity", "availability")
        }
        for item in resources
    ]
    canonical_windows = [
        {key: item[key] for key in ("window_id", "start", "end", "section_id", "availability")}
        for item in windows
    ]
    canonical_jobs = [
        {
            key: item[key]
            for key in (
                "job_id",
                "department",
                "asset_id",
                "section_id",
                "work_type",
                "priority",
                "duration_minutes",
                "duration_min_minutes",
                "duration_max_minutes",
                "required_resources",
                "allowed_windows",
                "status",
            )
        }
        for item in jobs
    ]
    canonical_train_paths = [
        {key: item[key] for key in ("train_path_id", "section_id", "start", "end")}
        for item in train_paths
    ]
    dataset = {
        "schema_version": "1.0",
        "sections": canonical_sections,
        "assets": canonical_assets,
        "resources": canonical_resources,
        "windows": canonical_windows,
        "jobs": canonical_jobs,
        "train_paths": canonical_train_paths,
        "conflict_groups": conflict_groups,
        "metadata": {
            "dataset_id": f"DEMO-WEEK-{prefix}-V1",
            "corridor_id": corridor_id,
            "corridor_name": (
                f"{'Narmada' if corridor_no == 1 else 'Sahyadri'} Demonstration Corridor"
            ),
            "horizon_start": stamp(START),
            "horizon_days": 7,
            "source_class": "CONTROLLED-SCENARIO",
            "ruleset_version": "Demo Ruleset v1",
            "generator_seed": 26027 + corridor_no,
            "disclaimer": (
                "Synthetic data. Demonstration ruleset. Human approval required. "
                "Not for operational sanctioning."
            ),
        },
    }
    return {
        "dataset": dataset,
        "stations": stations,
        "isolation_zones": isolation_zones,
        "block_rules": block_rules,
        "permits": permits,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("fixtures/generated"))
    args = parser.parse_args()
    generated = [build_corridor(1), build_corridor(2)]
    for index, data in enumerate(generated, start=1):
        corridor_dir = args.output_dir / f"corridor_{index}"
        for name in ("dataset", "stations", "isolation_zones", "block_rules", "permits"):
            write_json(corridor_dir / f"{name}.json", data[name])
    write_json(
        args.output_dir / "catalog.json",
        {
            "source_class": "CONTROLLED-SCENARIO",
            "planner_scope": "one corridor per run",
            "corridors": [
                {
                    "corridor_id": item["dataset"]["metadata"]["corridor_id"],
                    "dataset": f"corridor_{index}/dataset.json",
                }
                for index, item in enumerate(generated, start=1)
            ],
        },
    )


if __name__ == "__main__":
    main()
