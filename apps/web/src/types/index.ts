export type AppView =
  | "home"
  | "wizard-step-1" // Select Data
  | "wizard-step-2" // Check Data
  | "wizard-step-3" // Create Plan
  | "wizard-step-4" // Review Plan
  | "wizard-step-5" // Approve Plan
  | "plan-approved" // Plan Approved Confirmation
  | "previous-plans" // Previous Plans List
  | "rapid-block"; // Emergency Rapid Block

export type DepartmentType = "TRACK" | "SIGNAL" | "ELECTRICAL" | "CIVIL";

export type PlanningHorizon = "WEEKLY" | "MONTHLY";
export type SourceId = "tms" | "smms" | "tdms" | "civil";

export type RunState =
  | "QUEUED"
  | "RUNNING"
  | "FEASIBLE"
  | "OPTIMAL"
  | "INFEASIBLE"
  | "TIMEOUT"
  | "INVALID"
  | "FAILED";

export type ChangeStatus = "SCHEDULED" | "REJECTED" | "PRESERVED" | "CHANGED";

export type OptimizationStatus =
  | "UP_TO_DATE"
  | "UNSAVED_CONSTRAINTS"
  | "REOPTIMIZING"
  | "UPDATED"
  | "FAILED";

export interface DepartmentDataSource {
  id: SourceId;
  name: string;
  department: DepartmentType;
  fileName?: string;
  taskCount: number;
  rowCount?: number;
  warningCount?: number;
  warnings?: string[];
  payload?: DatasetPayloadShape;
  rawText?: string;
  contentType?: "application/json" | "text/csv";
  status: "ready" | "loaded" | "skipped";
  updatedAt?: string;
  sourceType: "CSV" | "JSON" | "SYSTEM_FEED";
}

export interface DatasetPayloadShape {
  schema_version: "1.0";
  sections: Array<Record<string, unknown>>;
  assets: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
  windows: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown> & { job_id?: string; department?: DepartmentType; allowed_windows?: string[] }>;
  train_paths?: Array<Record<string, unknown>>;
  conflict_groups?: Array<Record<string, unknown> & { member_ids?: string[] }>;
  metadata?: Record<string, unknown>;
}

export interface SourceSummaryView {
  source_id: string;
  department: string;
  status: string;
  file_name: string | null;
  job_count: number;
  warning_count: number;
}

export interface ValidationIssueItem {
  id: string;
  code: string;
  message: string;
  field: string;
  row?: number;
  jobId?: string;
  department?: DepartmentType;
  severity: "error" | "warning";
  suggestedFix?: string;
  resolved: boolean;
}

export interface ValidationState {
  valid: boolean;
  snapshotCandidateId: string | null;
  sourceHash: string | null;
  issues: ValidationIssueItem[];
  counts: {
    jobs: number;
    windows: number;
    assets: number;
    sections: number;
    resources: number;
  };
  sourceSummaries: SourceSummaryView[];
}

export interface SectionInfo {
  section_id: string;
  name: string;
  // The backend does not currently expose topology/track/constraint data for
  // sections - these are only ever populated when a real source is known.
  // Render "-" / an "unknown" state when absent instead of inventing values.
  from_node?: string | null;
  to_node?: string | null;
  km_start?: number | null;
  km_end?: number | null;
  tracks_total?: number | null;
  tracks_available?: number | null;
  status?: "CLEAR" | "CAUTION" | "RESTRICTED" | null;
  active_constraints?: number | null;
  total_works: number;
}

export interface ScheduleItemView {
  job_id: string;
  window_id: string;
  start: string;
  end: string;
  status: "SCHEDULED" | "LOCKED" | "REJECTED";
  reason_codes: string[];
  locked: boolean;
  is_integrated_block?: boolean;
}

export interface JobDetailView {
  job_id: string;
  department: DepartmentType;
  asset_id: string;
  section_id: string;
  location_km?: string;
  work_type: string;
  priority: number;
  priority_label: "HIGH" | "MEDIUM" | "LOW";
  duration_minutes: number;
  preferred_window?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  scheduled_window_id?: string;
  status: "SCHEDULED" | "LOCKED" | "REJECTED" | "UNSCHEDULED";
  locked: boolean;
  reason_codes: string[];
  // Real resource/window ids this job's section is known to use - used as a
  // real template when constructing a Rapid Block urgent_job for the same
  // section (no dedicated "snapshot entities" endpoint exists).
  required_resources?: string[];
  allowed_windows?: string[];
  ai_estimate?: {
    source: "LOCAL_HEURISTIC" | "DETERMINISTIC_FALLBACK";
    priority: number;
    duration_minutes: number;
    reason_codes: string[];
  };
}

export interface KpiView {
  baseline_closure_minutes: number;
  optimized_closure_minutes: number;
  closure_reduction_percent: number;
  baseline_asset_downtime_minutes: number;
  optimized_asset_downtime_minutes: number;
  downtime_reduction_minutes: number;
  downtime_reduction_percent: number;
  scheduled_maintenance_minutes: number;
  rejected_maintenance_minutes: number;
  plan_quality: "OPTIMAL" | "FEASIBLE" | "DEGRADED";
}

export interface PlanRunView {
  run_id: string;
  snapshot_id: string;
  ruleset_version: string;
  state: RunState;
  created_at: string;
  completed_at: string | null;
  parent_run_id?: string | null;
  jobs: JobDetailView[];
  schedule_items: ScheduleItemView[];
  unscheduled_jobs: Array<{ job_id: string; reason_codes: string[] }>;
  sections: SectionInfo[];
  kpis: KpiView;
  changes: Record<string, ChangeStatus>;
  validator: {
    passed: boolean;
    issues: Array<Record<string, unknown>>;
    validated_at: string;
  };
  approval: {
    reviewer: string;
    comment: string;
    approved_at: string;
    run_id: string;
    snapshot_id: string;
    ruleset_version: string;
  } | null;
  export_ready: boolean;
  intent_id?: string | null;
  intent?: Record<string, unknown> | null;
  rejected_intent_edits?: Array<Record<string, unknown>>;
}

export interface PendingMoveIntent {
  job_id: string;
  target_window_id: string;
  reason: string;
}

export interface RapidBlockFormValues {
  incidentType: string;
  sectionId: string;
  durationMinutes: number;
  notes: string;
}

export interface RapidBlockImpactView {
  requestId: string;
  state: "SUBMITTED" | "VALIDATING" | "PLANNING" | "CANDIDATE_READY" | "NO_CANDIDATE" | "REJECTED";
  baseRunId: string;
  childRunId: string | null;
  derivedSnapshotId: string | null;
  incidentLocation: {
    sectionId: string;
    kmMarker: string;
    incidentType: string;
  };
  rescheduledJobs: Array<{
    jobId: string;
    department: DepartmentType;
    sectionId: string;
    previousWindow: string;
    newWindow: string;
  }>;
  delayedTrains: Array<{
    trainId: string;
    trainName: string;
    delayMinutes: number;
    affectedSection: string;
  }>;
  preservedLockedJobs: string[];
  reasonCodes: string[];
  isCandidateReady: boolean;
  // True only if this result could not be computed by the real backend
  // (e.g. no template job/resources available to build a valid request) -
  // drives the "Simulated preview" badge so it's never confused with a real
  // dispatch result.
  isSimulated: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
  durationMs?: number;
}
