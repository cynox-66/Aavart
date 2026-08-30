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
  id: "tms" | "smms" | "tdms" | "civil";
  name: string;
  department: DepartmentType;
  fileName?: string;
  taskCount: number;
  status: "ready" | "loaded" | "skipped";
  updatedAt?: string;
  sourceType: "CSV" | "JSON" | "SYSTEM_FEED";
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
  issues: ValidationIssueItem[];
  counts: {
    jobs: number;
    windows: number;
    assets: number;
    sections: number;
    resources: number;
  };
}

export interface SectionInfo {
  section_id: string;
  name: string;
  from_node: string;
  to_node: string;
  km_start: number;
  km_end: number;
  tracks_total: number;
  tracks_available: number;
  status: "CLEAR" | "CAUTION" | "RESTRICTED";
  active_constraints: number;
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
}

export interface RapidBlockFormValues {
  incidentType: string;
  sectionId: string;
  durationMinutes: number;
  notes: string;
}

export interface RapidBlockImpactView {
  requestId: string;
  state: "SUBMITTED" | "VALIDATING" | "CANDIDATE_READY" | "NO_CANDIDATE" | "REJECTED";
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
}

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
  durationMs?: number;
}
