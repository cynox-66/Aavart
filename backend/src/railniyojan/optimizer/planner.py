from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta

from ortools.sat.python import cp_model

from railniyojan.contracts.enums import Availability, PlanningRunState, ScheduleStatus
from railniyojan.contracts.models import DatasetPayload, Job, PlanningWindow, Resource, ScheduleItem
from railniyojan.optimizer.contracts import OptimizerInput, OptimizerOutput


@dataclass
class Candidate:
    job: Job
    window: PlanningWindow
    start: cp_model.IntVar
    end: cp_model.IntVar
    present: cp_model.IntVar
    interval: cp_model.IntervalVar


def _minute(origin: datetime, value: datetime) -> int:
    return int((value - origin).total_seconds() // 60)


def _overlaps(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    return start_a < end_b and start_b < end_a


class DeterministicPlanner:
    """CP-SAT planner with a fixed seed, one worker, and a caller-supplied time budget.

    Seed and budget both arrive on the input rather than being hardcoded here, so
    `solver_time_budget_seconds` and `deterministic_seed` in settings are the one
    place either is set.
    """

    def solve(self, planner_input: OptimizerInput) -> OptimizerOutput:
        dataset = planner_input.dataset
        origin = min(window.start for window in dataset.windows)
        model = cp_model.CpModel()
        by_job: dict[str, list[Candidate]] = defaultdict(list)
        by_resource: dict[str, list[cp_model.IntervalVar]] = defaultdict(list)

        windows = {window.window_id: window for window in dataset.windows}
        resources = {resource.resource_id: resource for resource in dataset.resources}
        fixed = {item.job_id: item for item in planner_input.fixed_items}

        for job in dataset.jobs:
            if any(
                resources[resource_id].availability != Availability.AVAILABLE
                for resource_id in job.required_resources
            ):
                continue
            for window_id in job.allowed_windows:
                window = windows[window_id]
                earliest = _minute(origin, window.start)
                latest = _minute(origin, window.end) - job.duration_minutes
                if window.availability != Availability.AVAILABLE or latest < earliest:
                    continue
                suffix = f"{job.job_id}_{window.window_id}"
                start = model.new_int_var(earliest, latest, f"start_{suffix}")
                end = model.new_int_var(
                    earliest + job.duration_minutes,
                    latest + job.duration_minutes,
                    f"end_{suffix}",
                )
                present = model.new_bool_var(f"present_{suffix}")
                interval = model.new_optional_interval_var(
                    start, job.duration_minutes, end, present, f"interval_{suffix}"
                )
                candidate = Candidate(job, window, start, end, present, interval)
                by_job[job.job_id].append(candidate)
                for resource_id in job.required_resources:
                    by_resource[resource_id].append(interval)

        for job in dataset.jobs:
            candidates = by_job[job.job_id]
            if candidates:
                model.add(sum(candidate.present for candidate in candidates) <= 1)
            fixed_item = fixed.get(job.job_id)
            if fixed_item is None:
                continue
            matching = next(
                (
                    candidate
                    for candidate in candidates
                    if candidate.window.window_id == fixed_item.window_id
                ),
                None,
            )
            if matching is None:
                return self._invalid_locked_output(planner_input)
            model.add(matching.present == 1)
            model.add(matching.start == _minute(origin, fixed_item.start))
            for candidate in candidates:
                if candidate is not matching:
                    model.add(candidate.present == 0)

        for resource_id, intervals in by_resource.items():
            model.add_cumulative(intervals, [1] * len(intervals), resources[resource_id].capacity)

        train_intervals = {
            path.train_path_id: model.new_fixed_size_interval_var(
                _minute(origin, path.start),
                _minute(path.start, path.end),
                f"train_{path.train_path_id}",
            )
            for path in dataset.train_paths
        }
        for candidates in by_job.values():
            for candidate in candidates:
                for path in dataset.train_paths:
                    if path.section_id == candidate.job.section_id:
                        model.add_no_overlap(
                            [candidate.interval, train_intervals[path.train_path_id]]
                        )

        for group in dataset.conflict_groups:
            if group.conflict_type not in {"RESOURCE", "SECTION", "ISOLATION"}:
                continue
            intervals = [
                candidate.interval
                for member_id in group.member_ids
                for candidate in by_job.get(member_id, [])
            ]
            if intervals:
                model.add_no_overlap(intervals)

        model.maximize(
            sum(
                candidate.present * (candidate.job.priority * 1000 + 1)
                for candidates in by_job.values()
                for candidate in candidates
            )
        )
        solver = cp_model.CpSolver()
        solver.parameters.random_seed = planner_input.deterministic_seed
        solver.parameters.num_search_workers = 1
        solver.parameters.max_time_in_seconds = planner_input.time_budget_seconds
        status = solver.solve(model)

        if status not in {cp_model.OPTIMAL, cp_model.FEASIBLE}:
            state = (
                PlanningRunState.TIMEOUT
                if status == cp_model.UNKNOWN
                else PlanningRunState.INFEASIBLE
            )
            reason = "SOLVER_TIMEOUT" if state == PlanningRunState.TIMEOUT else "WINDOW_UNAVAILABLE"
            return OptimizerOutput(
                run_id=planner_input.run_id,
                state=state,
                schedule_items=[],
                unscheduled_reason_codes={job.job_id: [reason] for job in dataset.jobs},
            )

        items: list[ScheduleItem] = []
        selected_jobs: set[str] = set()
        for candidates in by_job.values():
            for candidate in candidates:
                if not solver.boolean_value(candidate.present):
                    continue
                fixed_item = fixed.get(candidate.job.job_id)
                scheduled_start = origin + timedelta(minutes=solver.value(candidate.start))
                locked = fixed_item.locked if fixed_item else False
                items.append(
                    ScheduleItem(
                        job_id=candidate.job.job_id,
                        window_id=candidate.window.window_id,
                        start=scheduled_start,
                        end=origin + timedelta(minutes=solver.value(candidate.end)),
                        status=ScheduleStatus.LOCKED if locked else ScheduleStatus.SCHEDULED,
                        reason_codes=["LOCK_PRESERVED"] if locked else ["PRIORITY_FIT"],
                        locked=locked,
                    )
                )
                selected_jobs.add(candidate.job.job_id)

        reasons = {
            job.job_id: self._explain_unscheduled(job, dataset, items, windows, resources)
            for job in dataset.jobs
            if job.job_id not in selected_jobs
        }
        state = (
            PlanningRunState.OPTIMAL
            if status == cp_model.OPTIMAL and items
            else PlanningRunState.FEASIBLE
            if items
            else PlanningRunState.INFEASIBLE
        )
        return OptimizerOutput(
            run_id=planner_input.run_id,
            state=state,
            schedule_items=sorted(items, key=lambda item: (item.start, item.job_id)),
            unscheduled_reason_codes=reasons,
            objective_value=solver.objective_value,
            bound=solver.best_objective_bound,
            gap=0.0 if status == cp_model.OPTIMAL else None,
        )

    @staticmethod
    def _invalid_locked_output(planner_input: OptimizerInput) -> OptimizerOutput:
        return OptimizerOutput(
            run_id=planner_input.run_id,
            state=PlanningRunState.INVALID,
            schedule_items=[],
            unscheduled_reason_codes={
                job.job_id: ["SAFETY_VALIDATION_FAILED"] for job in planner_input.dataset.jobs
            },
        )

    @staticmethod
    def _explain_unscheduled(
        job: Job,
        dataset: DatasetPayload,
        items: list[ScheduleItem],
        windows: dict[str, PlanningWindow],
        resources: dict[str, Resource],
    ) -> list[str]:
        if any(
            resources[item].availability != Availability.AVAILABLE
            for item in job.required_resources
        ):
            return ["RESOURCE_CONFLICT"]
        eligible = [
            windows[item]
            for item in job.allowed_windows
            if windows[item].availability == Availability.AVAILABLE
        ]
        if not eligible:
            return ["WINDOW_UNAVAILABLE"]
        fitting = [
            window
            for window in eligible
            if _minute(window.start, window.end) >= job.duration_minutes
        ]
        if not fitting:
            return ["DURATION_EXCEEDS_WINDOW"]
        if all(
            not any(
                all(
                    not _overlaps(
                        window.start + timedelta(minutes=offset),
                        window.start + timedelta(minutes=offset + job.duration_minutes),
                        path.start,
                        path.end,
                    )
                    for path in dataset.train_paths
                    if path.section_id == job.section_id
                )
                for offset in range(
                    _minute(window.start, window.end) - job.duration_minutes + 1
                )
            )
            for window in fitting
        ):
            return ["TRAIN_PATH_CONFLICT"]
        scheduled_jobs = {item.job_id for item in items}
        for group in dataset.conflict_groups:
            if job.job_id in group.member_ids and scheduled_jobs & set(group.member_ids):
                return [f"{group.conflict_type}_CONFLICT"]
        return ["RESOURCE_CONFLICT"]
