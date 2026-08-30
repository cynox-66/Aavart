import baselineDatasetFixture from "../../../../fixtures/baseline_valid/dataset.json";
import { DatasetPayloadShape, DepartmentDataSource, DepartmentType } from "@/types";

// Pre-submission staging data for the "Select Data" step - this represents
// what the planner is about to load, not a backend result, so it isn't
// subject to the "never fake a result" rule the same way. Task counts are
// derived from the real dataset fixture (the same file actually posted to
// /datasets/validate) so the numbers shown here match what gets validated.
type RawJob = { department?: string; [key: string]: unknown };

const countByDept = (jobs: RawJob[], dept: DepartmentType) =>
  jobs.filter((job) => job.department === dept).length;

const DEPARTMENT_CHANNELS: Array<{
  id: DepartmentDataSource["id"];
  name: string;
  department: DepartmentType;
}> = [
  { id: "tms", name: "Track Management System (TMS)", department: "TRACK" },
  { id: "smms", name: "Signal Maintenance System (SMMS)", department: "SIGNAL" },
  { id: "tdms", name: "Traction & OHE System (TDMS)", department: "ELECTRICAL" },
  { id: "civil", name: "Civil Engineering Works", department: "CIVIL" },
];

/**
 * Builds the four department source cards for a given corridor dataset.
 *
 * Every card starts out carrying the corridor dataset as its payload, so the
 * per-department task counts on screen are the real job counts from the file
 * that will be merged and posted to /datasets/validate. Replacing a single
 * department's file later overwrites only that card's payload.
 */
export function getDepartmentSources(
  dataset: Record<string, unknown>,
  label = "Corridor dataset",
  updatedAt = "Just now",
): DepartmentDataSource[] {
  const payload = dataset as unknown as DatasetPayloadShape;
  const jobs = (payload.jobs as RawJob[] | undefined) ?? [];
  return DEPARTMENT_CHANNELS.map(({ id, name, department }) => {
    const taskCount = countByDept(jobs, department);
    return {
      id,
      name,
      department,
      fileName: label,
      taskCount,
      rowCount: taskCount,
      warningCount: 0,
      warnings: [],
      payload,
      contentType: "application/json",
      status: "loaded",
      updatedAt,
      sourceType: "JSON",
      customDataset: null,
    };
  });
}

/** Department cards for the baseline test fixture (the "baseline" preset). */
export const initialDepartmentSources: DepartmentDataSource[] = getDepartmentSources(
  baselineDatasetFixture as Record<string, unknown>,
  "baseline_valid/dataset.json",
  "Baseline demo dataset",
);
