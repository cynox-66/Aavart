import baselineDatasetFixture from "../../../../fixtures/baseline_valid/dataset.json";
import {
  DatasetPayloadShape,
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
const baselineDatasetPayload = baselineDatasetFixture as DatasetPayloadShape;

export const initialDepartmentSources: DepartmentDataSource[] = [
  {
    id: "tms",
    name: "Track Management System (TMS)",
    department: "TRACK",
    fileName: "baseline_valid/dataset.json",
    taskCount: countByDept("TRACK"),
    rowCount: countByDept("TRACK"),
    warningCount: 0,
    warnings: [],
    payload: baselineDatasetPayload,
    contentType: "application/json",
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
    rowCount: countByDept("SIGNAL"),
    warningCount: 0,
    warnings: [],
    payload: baselineDatasetPayload,
    contentType: "application/json",
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
    rowCount: countByDept("ELECTRICAL"),
    warningCount: 0,
    warnings: [],
    payload: baselineDatasetPayload,
    contentType: "application/json",
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
    rowCount: countByDept("CIVIL"),
    warningCount: 0,
    warnings: [],
    payload: baselineDatasetPayload,
    contentType: "application/json",
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
