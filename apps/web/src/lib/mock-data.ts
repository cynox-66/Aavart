import baselineDatasetFixture from "../../../../fixtures/baseline_valid/dataset.json";
import {
  DepartmentDataSource,
  DepartmentType,
  JobDetailView,
  PlanRunView,
} from "@/types";

// Pre-submission staging data for the "Select Data" step - this represents
// what the planner is about to load, not a backend result, so it isn't
// subject to the "never fake a result" rule the same way. Task counts are
// derived from the real baseline fixture (the same file actually posted to
// /datasets/validate) so the numbers shown here match what gets validated.
const fixtureJobs = (baselineDatasetFixture as { jobs?: Array<{ department: DepartmentType }> }).jobs ?? [];
const countByDept = (dept: DepartmentType) => fixtureJobs.filter((j) => j.department === dept).length;

export const initialDepartmentSources: DepartmentDataSource[] = [
  {
    id: "tms",
    name: "Track Management System (TMS)",
    department: "TRACK",
    fileName: "baseline_valid/dataset.json",
    taskCount: countByDept("TRACK"),
    status: "loaded",
    updatedAt: "Baseline demo dataset",
    sourceType: "JSON",
  },
  {
    id: "smms",
    name: "Signal Maintenance System (SMMS)",
    department: "SIGNAL",
    fileName: "baseline_valid/dataset.json",
    taskCount: countByDept("SIGNAL"),
    status: "loaded",
    updatedAt: "Baseline demo dataset",
    sourceType: "JSON",
  },
  {
    id: "tdms",
    name: "Traction & OHE System (TDMS)",
    department: "ELECTRICAL",
    fileName: "baseline_valid/dataset.json",
    taskCount: countByDept("ELECTRICAL"),
    status: "loaded",
    updatedAt: "Baseline demo dataset",
    sourceType: "JSON",
  },
  {
    id: "civil",
    name: "Civil Engineering Works",
    department: "CIVIL",
    fileName: "baseline_valid/dataset.json",
    taskCount: countByDept("CIVIL"),
    status: "loaded",
    updatedAt: "Baseline demo dataset",
    sourceType: "JSON",
  },
];

// 26 Maintenance Jobs Matching "26 / 26 tasks planned"
const generateMockJobs = (): JobDetailView[] => {
  const jobs: JobDetailView[] = [
    {
      job_id: "JOB-001",
      department: "TRACK",
      asset_id: "ASSET-TRK-BRC-012",
      section_id: "ST-01",
      location_km: "Km 12/4 – 18/0",
      work_type: "Continuous Track Circuit Verification",
      priority: 80,
      priority_label: "HIGH",
      duration_minutes: 90,
      preferred_window: "Mon 08:00 – 09:30",
      scheduled_start: "2026-08-18T08:00:00+05:30",
      scheduled_end: "2026-08-18T09:30:00+05:30",
      scheduled_window_id: "WIN-ST01-MON-MORN",
      status: "SCHEDULED",
      locked: true,
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK", "SAFETY_PRIORITY"],
    },
    {
      job_id: "JOB-042",
      department: "TRACK",
      asset_id: "ASSET-TRK-AKW-512",
      section_id: "ST-03",
      location_km: "Km 512/8 – 518/4",
      work_type: "Track Maintenance (Rail Fracture)",
      priority: 95,
      priority_label: "HIGH",
      duration_minutes: 120,
      preferred_window: "Fri 22:00 – Sat 00:00",
      scheduled_start: "2026-08-22T22:00:00+05:30",
      scheduled_end: "2026-08-23T00:00:00+05:30",
      scheduled_window_id: "WIN-ST03-FRI-NIGHT",
      status: "SCHEDULED",
      locked: true,
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK", "SAFETY_PRIORITY"],
      ai_estimate: {
        source: "LOCAL_HEURISTIC",
        priority: 95,
        duration_minutes: 120,
        reason_codes: ["SAFETY_PRIORITY", "COMPATIBLE_WORK"],
      },
    },
    {
      job_id: "JOB-015",
      department: "SIGNAL",
      asset_id: "ASSET-SIG-POINT-114",
      section_id: "ST-03",
      location_km: "Km 514/2",
      work_type: "Electronic Interlocking Point Overhaul",
      priority: 85,
      priority_label: "HIGH",
      duration_minutes: 90,
      preferred_window: "Fri 22:00 – Sat 00:00",
      scheduled_start: "2026-08-22T22:00:00+05:30",
      scheduled_end: "2026-08-22T23:30:00+05:30",
      scheduled_window_id: "WIN-ST03-FRI-NIGHT",
      status: "SCHEDULED",
      locked: true,
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK", "SAFETY_PRIORITY"],
      ai_estimate: {
        source: "LOCAL_HEURISTIC",
        priority: 85,
        duration_minutes: 90,
        reason_codes: ["COMPATIBLE_WORK"],
      },
    },
    {
      job_id: "JOB-008",
      department: "ELECTRICAL",
      asset_id: "ASSET-OHE-CANTILEVER-88",
      section_id: "ST-02",
      location_km: "Km 98/4 – 102/1",
      work_type: "25kV OHE Contact Wire Replacement",
      priority: 78,
      priority_label: "MEDIUM",
      duration_minutes: 120,
      preferred_window: "Wed 10:00 – 12:00",
      scheduled_start: "2026-08-20T10:00:00+05:30",
      scheduled_end: "2026-08-20T12:00:00+05:30",
      scheduled_window_id: "WIN-ST02-WED-MORN",
      status: "SCHEDULED",
      locked: false,
      reason_codes: ["WINDOW_AVAILABLE", "RESOURCE_AVAILABLE"],
    },
    {
      job_id: "JOB-019",
      department: "CIVIL",
      asset_id: "ASSET-BRG-NARMADA-04",
      section_id: "ST-01",
      location_km: "Km 34/2 – 35/0",
      work_type: "Major Girder Structural Inspection",
      priority: 65,
      priority_label: "MEDIUM",
      duration_minutes: 150,
      preferred_window: "Mon 11:00 – 13:30",
      scheduled_start: "2026-08-18T11:00:00+05:30",
      scheduled_end: "2026-08-18T13:30:00+05:30",
      scheduled_window_id: "WIN-ST01-MON-NOON",
      status: "SCHEDULED",
      locked: false,
      reason_codes: ["WINDOW_AVAILABLE", "RESOURCE_AVAILABLE"],
    },
    {
      job_id: "JOB-027",
      department: "TRACK",
      asset_id: "ASSET-TRK-SUR-210",
      section_id: "ST-04",
      location_km: "Km 210/0 – 214/5",
      work_type: "Ballast Tamping & Deep Screening",
      priority: 72,
      priority_label: "MEDIUM",
      duration_minutes: 120,
      preferred_window: "Thu 16:00 – 18:00",
      scheduled_start: "2026-08-21T16:00:00+05:30",
      scheduled_end: "2026-08-21T18:00:00+05:30",
      scheduled_window_id: "WIN-ST04-THU-EVE",
      status: "SCHEDULED",
      locked: false,
      reason_codes: ["WINDOW_AVAILABLE"],
    },
    {
      job_id: "JOB-033",
      department: "ELECTRICAL",
      asset_id: "ASSET-OHE-SUBSTATION-02",
      section_id: "ST-02",
      location_km: "Km 132/6",
      work_type: "Traction Substation Transformer Service",
      priority: 88,
      priority_label: "HIGH",
      duration_minutes: 180,
      preferred_window: "Sat 23:30 – Sun 02:30",
      scheduled_start: "2026-08-23T23:30:00+05:30",
      scheduled_end: "2026-08-24T02:30:00+05:30",
      scheduled_window_id: "WIN-ST02-SAT-NIGHT",
      status: "SCHEDULED",
      locked: false,
      reason_codes: ["WINDOW_AVAILABLE", "SAFETY_PRIORITY"],
    },
  ];

  // Fill remaining jobs to total 26
  const depts: ("TRACK" | "SIGNAL" | "ELECTRICAL" | "CIVIL")[] = [
    "TRACK",
    "SIGNAL",
    "ELECTRICAL",
    "CIVIL",
  ];
  const sections: ("ST-01" | "ST-02" | "ST-03" | "ST-04")[] = [
    "ST-01",
    "ST-02",
    "ST-03",
    "ST-04",
  ];

  for (let i = 8; i <= 26; i++) {
    const padded = String(i).padStart(3, "0");
    const dept = depts[i % 4];
    const sec = sections[i % 4];
    jobs.push({
      job_id: `JOB-${padded}`,
      department: dept,
      asset_id: `ASSET-${dept.substring(0, 3)}-${sec}-${100 + i}`,
      section_id: sec,
      location_km: `Km ${40 + i * 5}/${(i % 9) + 1}`,
      work_type: `${dept} Scheduled Inspection & Testing #${i}`,
      priority: 60 + (i % 30),
      priority_label: i % 3 === 0 ? "HIGH" : "MEDIUM",
      duration_minutes: 60 + (i % 4) * 30,
      preferred_window: `Day ${(i % 7) + 1} 10:00 – 12:00`,
      scheduled_start: `2026-08-${18 + (i % 7)}T10:00:00+05:30`,
      scheduled_end: `2026-08-${18 + (i % 7)}T12:00:00+05:30`,
      scheduled_window_id: `WIN-${sec}-D${(i % 7) + 1}`,
      status: "SCHEDULED",
      locked: false,
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK"],
    });
  }

  return jobs;
};

// Scoped strictly to the "Previous Plans" demo path (handleOpenPreviousPlan
// in app/page.tsx) - PreviousPlansList has no real backend to source
// historical runs from (no list-runs endpoint exists), so this stays a
// clearly-labeled demo plan rather than a fallback for a real run.
export const demoHistoricalPlan: PlanRunView = {
  run_id: "RUN-WR-014",
  snapshot_id: "SNAP-014",
  ruleset_version: "Demo Ruleset v1",
  state: "OPTIMAL",
  created_at: "2026-08-26T10:30:00+05:30",
  completed_at: "2026-08-26T10:42:00+05:30",
  parent_run_id: null,
  export_ready: true,
  sections: [
    { section_id: "ST-01", name: "BRC – VDA", from_node: "BRC", to_node: "VDA", km_start: 0, km_end: 52, tracks_total: 2, tracks_available: 2, status: "CLEAR", active_constraints: 0, total_works: 4 },
    { section_id: "ST-02", name: "VDA – AKW", from_node: "VDA", to_node: "AKW", km_start: 52, km_end: 146, tracks_total: 2, tracks_available: 1, status: "CAUTION", active_constraints: 3, total_works: 8 },
    { section_id: "ST-03", name: "AKW – BHU", from_node: "AKW", to_node: "BHU", km_start: 146, km_end: 198, tracks_total: 2, tracks_available: 0, status: "RESTRICTED", active_constraints: 5, total_works: 7 },
    { section_id: "ST-04", name: "BHU – SUR", from_node: "BHU", to_node: "SUR", km_start: 198, km_end: 256, tracks_total: 2, tracks_available: 2, status: "CLEAR", active_constraints: 1, total_works: 7 },
  ],
  kpis: {
    baseline_closure_minutes: 390,
    optimized_closure_minutes: 250,
    closure_reduction_percent: 36.0,
    baseline_asset_downtime_minutes: 390,
    optimized_asset_downtime_minutes: 160,
    downtime_reduction_minutes: 230,
    downtime_reduction_percent: 58.8,
    scheduled_maintenance_minutes: 270,
    rejected_maintenance_minutes: 0,
    plan_quality: "OPTIMAL",
  },
  validator: {
    passed: true,
    issues: [],
    validated_at: "2026-08-26T10:42:00+05:30",
  },
  approval: null,
  changes: {},
  unscheduled_jobs: [],
  schedule_items: [
    {
      job_id: "JOB-042",
      window_id: "WIN-ST03-FRI-NIGHT",
      start: "2026-08-22T22:00:00+05:30",
      end: "2026-08-23T00:00:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK", "SAFETY_PRIORITY"],
      locked: true,
      is_integrated_block: true,
    },
    {
      job_id: "JOB-015",
      window_id: "WIN-ST03-FRI-NIGHT",
      start: "2026-08-22T22:00:00+05:30",
      end: "2026-08-22T23:30:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK", "SAFETY_PRIORITY"],
      locked: true,
      is_integrated_block: true,
    },
    {
      job_id: "JOB-001",
      window_id: "WIN-ST01-MON-MORN",
      start: "2026-08-18T08:00:00+05:30",
      end: "2026-08-18T09:30:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE", "COMPATIBLE_WORK"],
      locked: true,
      is_integrated_block: true,
    },
    {
      job_id: "JOB-008",
      window_id: "WIN-ST02-WED-MORN",
      start: "2026-08-20T10:00:00+05:30",
      end: "2026-08-20T12:00:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE"],
      locked: false,
    },
    {
      job_id: "JOB-019",
      window_id: "WIN-ST01-MON-NOON",
      start: "2026-08-18T11:00:00+05:30",
      end: "2026-08-18T13:30:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE"],
      locked: false,
    },
    {
      job_id: "JOB-027",
      window_id: "WIN-ST04-THU-EVE",
      start: "2026-08-21T16:00:00+05:30",
      end: "2026-08-21T18:00:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE"],
      locked: false,
    },
    {
      job_id: "JOB-033",
      window_id: "WIN-ST02-SAT-NIGHT",
      start: "2026-08-23T23:30:00+05:30",
      end: "2026-08-24T02:30:00+05:30",
      status: "SCHEDULED",
      reason_codes: ["WINDOW_AVAILABLE", "SAFETY_PRIORITY"],
      locked: false,
    },
  ],
  jobs: generateMockJobs(),
};

export const mockPreviousPlans: Array<{
  runId: string;
  snapshotId: string;
  date: string;
  state: string;
  approvedBy?: string;
  tasksCount: number;
  downtimeSaved: string;
  isApproved: boolean;
}> = [
  {
    runId: "RUN-WR-014",
    snapshotId: "SNAP-014",
    date: "2026-08-26",
    state: "OPTIMAL",
    approvedBy: "AR (Divisional Manager, WR - Vadodara)",
    tasksCount: 26,
    downtimeSaved: "-36.0%",
    isApproved: true,
  },
  {
    runId: "RUN-WR-013",
    snapshotId: "SNAP-013",
    date: "2026-08-23",
    state: "OPTIMAL",
    approvedBy: "AR (Divisional Manager, WR - Vadodara)",
    tasksCount: 24,
    downtimeSaved: "-34.8%",
    isApproved: true,
  },
  {
    runId: "RUN-WR-012",
    snapshotId: "SNAP-012",
    date: "2026-08-16",
    state: "OPTIMAL",
    approvedBy: "AR (Divisional Manager, WR - Vadodara)",
    tasksCount: 22,
    downtimeSaved: "-31.2%",
    isApproved: true,
  },
  {
    runId: "RUN-WR-011",
    snapshotId: "SNAP-011",
    date: "2026-08-09",
    state: "FEASIBLE",
    approvedBy: "K. S. Verma (Chief Planner)",
    tasksCount: 27,
    downtimeSaved: "-28.5%",
    isApproved: true,
  },
];

