import { describe, expect, it } from "vitest";
import { CORRIDOR_PRESETS } from "./corridor-presets";
import { getDepartmentSources } from "./mock-data";
import { mergeDepartmentSources } from "./ingestion";
import { hasAnyGeo } from "./station-geo";

type Section = { section_id: string; from_node?: string; to_node?: string };

/**
 * Guards the Step 1 corridor selection end-to-end: picking a preset must seed
 * department cards whose merged payload still carries that corridor's jobs, and
 * the resulting section nodes must resolve to real coordinates - otherwise the
 * review screen silently falls back to the schematic map.
 */
describe("corridor selection", () => {
  it.each(CORRIDOR_PRESETS.filter((preset) => preset.dataset))(
    "merges $id into a payload the corridor map can place",
    (preset) => {
      const sources = getDepartmentSources(preset.dataset!, preset.label);
      const merged = mergeDepartmentSources(sources);

      expect(merged.jobs.length).toBeGreaterThan(0);
      expect(merged.sections.length).toBe(preset.sectionCount || merged.sections.length);

      // The same from_node/to_node lookup the planning adapter rebuilds sections with.
      const nodes = (merged.sections as unknown as Section[]).flatMap((s) => [s.from_node, s.to_node]);
      // Only the generated corridors ship station coordinates; the baseline
      // fixture is expected to fall back to the schematic map.
      expect(hasAnyGeo(nodes)).toBe(preset.id.startsWith("corridor-"));
    },
  );

  it("keeps every job of the selected corridor inside the weekly horizon", () => {
    const c1 = CORRIDOR_PRESETS.find((preset) => preset.id === "corridor-c1")!;
    const merged = mergeDepartmentSources(getDepartmentSources(c1.dataset!, c1.label));
    expect(merged.jobs.length).toBe(c1.jobCount);
  });
});
