import {
  DatasetPayloadShape,
  DepartmentDataSource,
  DepartmentType,
} from "@/types";

const ENTITY_KEYS: Record<string, keyof DatasetPayloadShape> = {
  section: "sections",
  asset: "assets",
  resource: "resources",
  window: "windows",
  job: "jobs",
  train_path: "train_paths",
  conflict_group: "conflict_groups",
};

const LIST_FIELDS = new Set(["required_resources", "allowed_windows", "member_ids"]);
const INT_FIELDS = new Set(["capacity", "priority", "duration_minutes", "duration_min_minutes", "duration_max_minutes"]);

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function csvValue(field: string, value: string): unknown {
  const stripped = value.trim();
  if (LIST_FIELDS.has(field)) {
    if (!stripped) return [];
    if (stripped.startsWith("[")) return JSON.parse(stripped);
    return stripped.split("|").map((item) => item.trim()).filter(Boolean);
  }
  if (INT_FIELDS.has(field)) return Number.parseInt(stripped, 10);
  if (stripped.toLowerCase() === "true") return true;
  if (stripped.toLowerCase() === "false") return false;
  return stripped;
}

function parseCsvPayload(text: string): DatasetPayloadShape {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const [headerLine, ...body] = lines;
  if (!headerLine) throw new Error("CSV file is empty");
  const headers = splitCsvLine(headerLine).map((item) => item.trim());
  const entityIndex = headers.indexOf("entity");
  if (entityIndex < 0) throw new Error("CSV must include an entity column");
  const payload: DatasetPayloadShape = {
    schema_version: "1.0",
    sections: [],
    assets: [],
    resources: [],
    windows: [],
    jobs: [],
    train_paths: [],
    conflict_groups: [],
    metadata: { source_format: "csv" },
  };
  for (const line of body) {
    const values = splitCsvLine(line);
    const entity = String(values[entityIndex] ?? "").trim().toLowerCase();
    const key = ENTITY_KEYS[entity];
    if (!key) throw new Error(`Unsupported CSV entity: ${entity}`);
    const item: Record<string, unknown> = {};
    headers.forEach((field, index) => {
      const raw = values[index];
      if (field === "entity" || raw === undefined || raw.trim() === "") return;
      item[field] = csvValue(field, raw);
    });
    (payload[key] as Array<Record<string, unknown>>).push(item);
  }
  return payload;
}

function clonePayload(payload: DatasetPayloadShape): DatasetPayloadShape {
  return JSON.parse(JSON.stringify(payload)) as DatasetPayloadShape;
}

function idOf(item: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function pushUnique<T extends Record<string, unknown>>(target: T[], source: T[], keys: string[]) {
  const seen = new Set(target.map((item) => idOf(item, keys)).filter(Boolean));
  for (const item of source) {
    const id = idOf(item, keys);
    if (id && seen.has(id)) continue;
    target.push(item);
    if (id) seen.add(id);
  }
}

function sourceJobCount(payload: DatasetPayloadShape, department: DepartmentType): number {
  return payload.jobs.filter((job) => job.department === department).length;
}

/**
 * Reads one uploaded dataset file into a payload. Shared by the per-department
 * "Replace File" action and the custom corridor's base upload, so both accept
 * the same JSON and CSV shapes.
 */
export async function parseDatasetFile(
  file: File,
): Promise<{ payload: DatasetPayloadShape; text: string; isCsv: boolean }> {
  const text = await file.text();
  const isCsv = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
  const payload = isCsv ? parseCsvPayload(text) : (JSON.parse(text) as DatasetPayloadShape);
  return { payload, text, isCsv };
}

export async function sourceFromFile(
  current: DepartmentDataSource,
  file: File,
): Promise<DepartmentDataSource> {
  const { payload, text, isCsv } = await parseDatasetFile(file);
  const taskCount = sourceJobCount(payload, current.department);
  return {
    ...current,
    fileName: file.name,
    sourceType: isCsv ? "CSV" : "JSON",
    contentType: isCsv ? "text/csv" : "application/json",
    rawText: text,
    payload,
    taskCount,
    rowCount: taskCount,
    warningCount: 0,
    warnings: [],
    status: "loaded",
    updatedAt: "Just now",
  };
}

/**
 * Planning is weekly. A "Monthly (Macro)" toggle used to widen this filter to 30
 * days, but the backend has no notion of a horizon at all - it would have solved
 * a month of demand as one week. Monthly planning is a real feature (a backend
 * parameter, different window generation, a second output view) and is not one
 * this function can fake, so the horizon is a constant until that is built.
 */
export const PLANNING_HORIZON_DAYS = 7;

export function mergeDepartmentSources(
  sources: DepartmentDataSource[],
): DatasetPayloadShape {
  const loaded = sources.filter((source) => source.status === "loaded");
  if (loaded.length === 0) throw new Error("Select at least one department dataset");
  const missing = loaded.find((source) => !source.payload);
  if (missing) throw new Error(`${missing.name} has no readable payload`);

  const merged: DatasetPayloadShape = {
    schema_version: "1.0",
    sections: [],
    assets: [],
    resources: [],
    windows: [],
    jobs: [],
    train_paths: [],
    conflict_groups: [],
    metadata: {},
  };

  for (const source of loaded) {
    const payload = clonePayload(source.payload as DatasetPayloadShape);
    pushUnique(merged.sections, payload.sections, ["section_id"]);
    pushUnique(merged.assets, payload.assets, ["asset_id"]);
    pushUnique(merged.resources, payload.resources, ["resource_id"]);
    pushUnique(merged.windows, payload.windows, ["window_id"]);
    pushUnique(merged.train_paths ?? [], payload.train_paths ?? [], ["train_path_id"]);
    pushUnique(merged.conflict_groups ?? [], payload.conflict_groups ?? [], ["conflict_group_id"]);
    merged.jobs.push(...payload.jobs.filter((job) => job.department === source.department));
  }

  const starts = merged.windows
    .map((window) => Date.parse(String(window.start)))
    .filter((value) => Number.isFinite(value));
  const horizonStartMs = starts.length ? Math.min(...starts) : Date.now();
  const horizonDays = PLANNING_HORIZON_DAYS;
  const horizonEndMs = horizonStartMs + horizonDays * 24 * 60 * 60 * 1000;
  const keptWindowIds = new Set(
    merged.windows
      .filter((window) => {
        const start = Date.parse(String(window.start));
        return Number.isFinite(start) && start >= horizonStartMs && start < horizonEndMs;
      })
      .map((window) => String(window.window_id)),
  );
  merged.windows = merged.windows.filter((window) => keptWindowIds.has(String(window.window_id)));
  merged.jobs = merged.jobs
    .map((job) => ({
      ...job,
      allowed_windows: (job.allowed_windows ?? []).filter((windowId) => keptWindowIds.has(windowId)),
    }))
    .filter((job) => (job.allowed_windows ?? []).length > 0);

  const keptJobIds = new Set(merged.jobs.map((job) => job.job_id).filter(Boolean));
  merged.conflict_groups = (merged.conflict_groups ?? [])
    .map((group) => ({
      ...group,
      member_ids: (group.member_ids ?? []).filter((member) => !String(member).startsWith("JOB-") || keptJobIds.has(member)),
    }))
    .filter((group) => (group.member_ids ?? []).length >= 2);

  merged.metadata = {
    ...(loaded[0]?.payload?.metadata ?? {}),
    source_provenance: sources.map((source) => ({
      source_id: source.id,
      department: source.department,
      status: source.status,
      file_name: source.fileName ?? null,
      job_count: source.status === "loaded" ? source.taskCount : 0,
      warning_count: source.warningCount ?? 0,
    })),
    horizon: "WEEKLY",
    horizon_start: new Date(horizonStartMs).toISOString(),
    horizon_end: new Date(horizonEndMs).toISOString(),
    horizon_days: horizonDays,
  };
  return merged;
}
