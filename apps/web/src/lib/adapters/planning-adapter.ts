import baselineDatasetFixture from "../../../../../fixtures/baseline_valid/dataset.json";
import {
  approveRun,
  createPlanningRun,
  downloadRun,
  getApiHealth,
  lockScheduleItem,
  replanRun,
  validateDataset,
  type RunDetail,
  type ValidationResponse,
} from "@/lib/api";
import {
  mockBaselinePlan,
  mockCorridorSections,
  mockRapidBlockImpact,
} from "@/lib/mock-data";
import {
  JobDetailView,
  PlanRunView,
  RapidBlockFormValues,
  RapidBlockImpactView,
  ScheduleItemView,
  ValidationState,
} from "@/types";

export function mapBackendRunToView(run: RunDetail): PlanRunView {
  const jobsMap = new Map(run.jobs.map((j) => [j.job_id, j]));
  const scheduleMap = new Map(run.schedule_items.map((s) => [s.job_id, s]));
  const aiMap = new Map(run.ai_estimates.map((a) => [a.job_id, a]));

  const jobsView: JobDetailView[] = run.jobs.map((j) => {
    const s = scheduleMap.get(j.job_id);
    const ai = aiMap.get(j.job_id);
    const unscheduled = run.unscheduled_jobs.find((u) => u.job_id === j.job_id);
    const reason_codes = s?.reason_codes ?? unscheduled?.reason_codes ?? ai?.reason_codes ?? ["PRIORITY_FIT"];

    let priority_label: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    if (j.priority >= 80) priority_label = "HIGH";
    else if (j.priority < 60) priority_label = "LOW";

    const isLocked = Boolean(s?.locked);
    const status = s?.status === "SCHEDULED" ? (isLocked ? "LOCKED" : "SCHEDULED") : "UNSCHEDULED";

    return {
      job_id: j.job_id,
      department: (j.department as any) || "TRACK",
      asset_id: j.asset_id,
      section_id: j.section_id,
      location_km: `Section ${j.section_id} / ${j.asset_id}`,
      work_type: j.work_type,
      priority: j.priority,
      priority_label,
      duration_minutes: ai?.duration_minutes ?? 120,
      preferred_window: s?.window_id ?? "Regular Night Window",
      scheduled_start: s?.start,
      scheduled_end: s?.end,
      scheduled_window_id: s?.window_id,
      status,
      locked: isLocked,
      reason_codes,
      ai_estimate: ai
        ? {
            source: ai.source,
            priority: ai.priority,
            duration_minutes: ai.duration_minutes,
            reason_codes: ai.reason_codes,
          }
        : undefined,
    };
  });

  const schedule_items: ScheduleItemView[] = run.schedule_items.map((s) => ({
    job_id: s.job_id,
    window_id: s.window_id,
    start: s.start,
    end: s.end,
    status: s.status,
    reason_codes: s.reason_codes,
    locked: s.locked,
    is_integrated_block: s.reason_codes.some((c) => c.includes("SHARED") || c.includes("MULTI")),
  }));

  const uniqueSections = Array.from(new Set(run.jobs.map((j) => j.section_id)));
  const sections = uniqueSections.map((secId, index) => {
    const matchingMock = mockCorridorSections.find((s) => s.section_id === secId);
    if (matchingMock) return matchingMock;
    return {
      section_id: secId,
      name: `Section ${secId}`,
      from_node: `Node-${index + 1}`,
      to_node: `Node-${index + 2}`,
      km_start: index * 50,
      km_end: (index + 1) * 50,
      tracks_total: 2,
      tracks_available: 2,
      status: "CLEAR" as const,
      active_constraints: 1,
      total_works: run.jobs.filter((j) => j.section_id === secId).length,
    };
  });

  const closureReduction = run.kpis.baseline_closure_minutes > 0
    ? ((run.kpis.baseline_closure_minutes - run.kpis.optimized_closure_minutes) / run.kpis.baseline_closure_minutes) * 100
    : 0;

  return {
    run_id: run.run_id,
    snapshot_id: run.snapshot_id,
    ruleset_version: run.ruleset_version,
    state: run.state,
    created_at: run.created_at,
    completed_at: run.completed_at,
    parent_run_id: run.parent_run_id,
    export_ready: run.export_ready,
    jobs: jobsView,
    schedule_items,
    unscheduled_jobs: run.unscheduled_jobs,
    sections,
    kpis: {
      baseline_closure_minutes: run.kpis.baseline_closure_minutes,
      optimized_closure_minutes: run.kpis.optimized_closure_minutes,
      closure_reduction_percent: closureReduction,
      baseline_asset_downtime_minutes: run.kpis.baseline_asset_downtime_minutes,
      optimized_asset_downtime_minutes: run.kpis.optimized_asset_downtime_minutes,
      downtime_reduction_minutes: run.kpis.downtime_reduction_minutes,
      downtime_reduction_percent: run.kpis.downtime_reduction_percent,
      scheduled_maintenance_minutes: run.kpis.scheduled_maintenance_minutes,
      rejected_maintenance_minutes: run.kpis.rejected_maintenance_minutes,
      plan_quality: run.state === "OPTIMAL" ? "OPTIMAL" : run.state === "FEASIBLE" ? "FEASIBLE" : "DEGRADED",
    },
    changes: run.changes,
    validator: run.validator,
    approval: run.approval,
  };
}

export async function isBackendAlive(): Promise<boolean> {
  try {
    const res = await getApiHealth();
    return res.status === "ok";
  } catch {
    return false;
  }
}

export async function validateDatasetAdapter(
  payload: unknown,
  format: "CSV" | "JSON" = "JSON",
): Promise<ValidationState> {
  try {
    const res: ValidationResponse = await validateDataset(
      payload || baselineDatasetFixture,
      format === "CSV" ? "text/csv" : "application/json",
    );
    return {
      valid: res.valid,
      snapshotCandidateId: res.snapshot_candidate_id ?? "SNAP-014-CANDIDATE",
      issues: res.errors.map((err, i) => ({
        id: `API-ERR-${i + 1}`,
        code: err.code,
        message: err.message,
        field: err.field,
        row: err.row ?? undefined,
        severity: "error",
        resolved: false,
      })),
      counts: res.counts,
    };
  } catch {
    // Offline simulated validation
    return {
      valid: true,
      snapshotCandidateId: "SNAP-014",
      issues: [],
      counts: {
        jobs: 26,
        windows: 18,
        assets: 24,
        sections: 4,
        resources: 12,
      },
    };
  }
}

export async function createPlanningRunAdapter(snapshotId: string): Promise<PlanRunView> {
  try {
    const detail = await createPlanningRun(snapshotId);
    return mapBackendRunToView(detail);
  } catch {
    // Return high-fidelity baseline plan
    return {
      ...mockBaselinePlan,
      snapshot_id: snapshotId || mockBaselinePlan.snapshot_id,
    };
  }
}

export async function lockScheduleItemAdapter(
  runId: string,
  jobId: string,
  currentPlan: PlanRunView,
): Promise<PlanRunView> {
  try {
    const detail = await lockScheduleItem(runId, jobId);
    return mapBackendRunToView(detail);
  } catch {
    // Local state fallback
    const updatedJobs = currentPlan.jobs.map((j) =>
      j.job_id === jobId
        ? {
            ...j,
            locked: true,
            status: "LOCKED" as const,
            reason_codes: Array.from(new Set([...j.reason_codes, "LOCK_PRESERVED"])),
          }
        : j,
    );

    const updatedSchedule = currentPlan.schedule_items.map((s) =>
      s.job_id === jobId
        ? {
            ...s,
            locked: true,
            status: "LOCKED" as const,
            reason_codes: Array.from(new Set([...s.reason_codes, "LOCK_PRESERVED"])),
          }
        : s,
    );

    return {
      ...currentPlan,
      jobs: updatedJobs,
      schedule_items: updatedSchedule,
    };
  }
}

export async function replanRunAdapter(
  runId: string,
  affectedSections: string[],
  affectedWindows: string[],
  currentPlan: PlanRunView,
): Promise<PlanRunView> {
  try {
    const detail = await replanRun(runId, affectedSections, affectedWindows);
    return mapBackendRunToView(detail);
  } catch {
    // High-fidelity fallback simulating a replan run with preserved locks
    const newRunId = `RUN-WR-${Math.floor(Math.random() * 800 + 100)}`;
    const changes: Record<string, "SCHEDULED" | "REJECTED" | "PRESERVED" | "CHANGED"> = {};

    currentPlan.jobs.forEach((j) => {
      if (j.locked) {
        changes[j.job_id] = "PRESERVED";
      } else {
        changes[j.job_id] = "CHANGED";
      }
    });

    return {
      ...currentPlan,
      run_id: newRunId,
      parent_run_id: runId,
      created_at: new Date().toISOString(),
      changes,
      kpis: {
        ...currentPlan.kpis,
        optimized_closure_minutes: 240,
        closure_reduction_percent: 38.5,
        downtime_reduction_percent: 61.2,
      },
    };
  }
}

export async function approveRunAdapter(
  runId: string,
  reviewer: string,
  comment: string,
  currentPlan: PlanRunView,
): Promise<PlanRunView> {
  try {
    const detail = await approveRun(runId, reviewer);
    return mapBackendRunToView(detail);
  } catch {
    return {
      ...currentPlan,
      export_ready: true,
      approval: {
        reviewer,
        comment,
        approved_at: new Date().toISOString(),
        run_id: runId,
        snapshot_id: currentPlan.snapshot_id,
        ruleset_version: currentPlan.ruleset_version,
      },
    };
  }
}

export async function exportRunAdapter(runId: string, currentPlan?: PlanRunView): Promise<void> {
  try {
    await downloadRun(runId);
  } catch {
    // Generate browser download for CSV
    const rows = [
      ["Job ID", "Department", "Section", "Window ID", "Start Time", "End Time", "Status", "Reason Codes"],
      ...(currentPlan?.jobs.map((j) => [
        j.job_id,
        j.department,
        j.section_id,
        j.scheduled_window_id ?? "-",
        j.scheduled_start ?? "-",
        j.scheduled_end ?? "-",
        j.status,
        j.reason_codes.join(";"),
      ]) ?? []),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RailNiyojan_${runId}_ApprovedSchedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export async function submitRapidBlockAdapter(
  form: RapidBlockFormValues,
  baseRunId: string,
): Promise<RapidBlockImpactView> {
  return {
    ...mockRapidBlockImpact,
    baseRunId,
    incidentLocation: {
      sectionId: form.sectionId,
      kmMarker: form.sectionId === "ST-03" ? "Km 512/4" : "Km 84/2",
      incidentType: form.incidentType,
    },
  };
}
