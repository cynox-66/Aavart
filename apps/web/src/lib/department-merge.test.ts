import { describe, expect, it } from "vitest";
import baselineDatasetFixture from "../../../../fixtures/baseline_valid/dataset.json";
import { PLANNING_HORIZON_DAYS, mergeDepartmentSources } from "./ingestion";
import { getDepartmentSources } from "./mock-data";
import type { DatasetPayloadShape, DepartmentDataSource } from "@/types";

const baseline = baselineDatasetFixture as unknown as Record<string, unknown>;

function sources(): DepartmentDataSource[] {
  return getDepartmentSources(baseline, "baseline_valid/dataset.json");
}

function departmentsOf(payload: DatasetPayloadShape): string[] {
  return payload.jobs.map((job) => String(job.department));
}

/**
 * Guards Step 1 -> Step 2: what the operator does to the department cards has to
 * be what the backend is asked to validate. Skipping a card must drop exactly
 * that department's jobs, and an uploaded override must replace them rather than
 * stack on top of the corridor default. These are the assertions the e2e
 * "skipping a department changes the validated job count" test pays a full
 * browser round-trip for.
 */
describe("mergeDepartmentSources", () => {
  it("keeps one job per department claim, never another card's jobs", () => {
    const merged = mergeDepartmentSources(sources());
    const seen = new Set<string>();

    for (const job of merged.jobs) {
      expect(seen.has(String(job.job_id))).toBe(false);
      seen.add(String(job.job_id));
    }
    // Every card ships the same corridor payload; only jobs whose department
    // matches the card survive, so the merge must not multiply the job list.
    expect(merged.jobs.length).toBe((baseline.jobs as unknown[]).length);
  });

  it("drops exactly the skipped department's jobs", () => {
    const all = mergeDepartmentSources(sources());
    const civilCount = departmentsOf(all).filter((dept) => dept === "CIVIL").length;
    expect(civilCount).toBeGreaterThan(0);

    const skipped = sources().map((source) =>
      source.department === "CIVIL" ? { ...source, status: "skipped" as const } : source,
    );
    const merged = mergeDepartmentSources(skipped);

    expect(departmentsOf(merged)).not.toContain("CIVIL");
    expect(merged.jobs.length).toBe(all.jobs.length - civilCount);
  });

  it("refuses a selection where every department is skipped", () => {
    const none = sources().map((source) => ({ ...source, status: "skipped" as const }));
    expect(() => mergeDepartmentSources(none)).toThrow(/at least one/i);
  });

  it("records per-source provenance for skipped and loaded cards alike", () => {
    const skipped = sources().map((source) =>
      source.department === "CIVIL" ? { ...source, status: "skipped" as const } : source,
    );
    const merged = mergeDepartmentSources(skipped);
    const provenance = (merged.metadata ?? {}).source_provenance as Array<{
      department: string;
      status: string;
      job_count: number;
    }>;

    expect(provenance).toHaveLength(skipped.length);
    const civil = provenance.find((entry) => entry.department === "CIVIL");
    expect(civil).toMatchObject({ status: "skipped", job_count: 0 });
  });

  it("takes an uploaded override in place of the corridor default for that card", () => {
    const override = JSON.parse(JSON.stringify(baseline)) as DatasetPayloadShape;
    const civilJob = override.jobs.find((job) => job.department === "CIVIL");
    expect(civilJob).toBeDefined();
    override.jobs = [{ ...civilJob!, job_id: "JOB-OVERRIDE-1" }];
    override.conflict_groups = [];

    const withOverride = sources().map((source) =>
      source.department === "CIVIL"
        ? { ...source, payload: override, fileName: "civil-override.json" }
        : source,
    );
    const merged = mergeDepartmentSources(withOverride);
    const civilJobs = merged.jobs.filter((job) => String(job.department) === "CIVIL");

    expect(civilJobs.map((job) => String(job.job_id))).toEqual(["JOB-OVERRIDE-1"]);
  });

  it("stamps the fixed weekly horizon it filtered against", () => {
    const merged = mergeDepartmentSources(sources());

    const metadata = merged.metadata ?? {};
    expect(metadata.horizon).toBe("WEEKLY");
    expect(metadata.horizon_days).toBe(PLANNING_HORIZON_DAYS);
    const start = Date.parse(String(metadata.horizon_start));
    const end = Date.parse(String(metadata.horizon_end));
    expect(end - start).toBe(PLANNING_HORIZON_DAYS * 24 * 60 * 60 * 1000);

    for (const window of merged.windows) {
      const windowStart = Date.parse(String(window.start));
      expect(windowStart).toBeGreaterThanOrEqual(start);
      expect(windowStart).toBeLessThan(end);
    }
  });

  it("leaves no job pointing at a window the horizon filter removed", () => {
    const merged = mergeDepartmentSources(sources());
    const windowIds = new Set(merged.windows.map((window) => String(window.window_id)));

    for (const job of merged.jobs) {
      const allowed = job.allowed_windows ?? [];
      expect(allowed.length).toBeGreaterThan(0);
      for (const windowId of allowed) {
        expect(windowIds.has(String(windowId))).toBe(true);
      }
    }
  });
});
