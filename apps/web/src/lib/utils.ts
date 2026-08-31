import { DepartmentType, RunState } from "@/types";

// Single simulated reviewer identity used throughout the demo UI. This is not
// authenticated user state; it is just a visible demo label.
export const CURRENT_REVIEWER = "Simulated Reviewer (Demo)";

// Rapid Block's actor must be in the backend's PLANNER_ALLOWLIST env var
// (defaults to "planner-01" in .env) or the request is REJECTED with
// UNAUTHORISED_ACTOR. There's no auth system, so this is a fixed demo actor.
export const RAPID_BLOCK_ACTOR = "planner-01";

export function formatStamp(value?: string | null): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return value;
  }
}

export function formatTime(value?: string | null): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return value;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

export function formatDateRange(start?: Date | null, end?: Date | null): string {
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "No scheduled dates yet";
  }
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const startStr = start.toLocaleDateString("en-IN", opts);
  const endStr = end.toLocaleDateString("en-IN", { ...opts, year: "numeric" });
  return `${startStr} – ${endStr}`;
}

/** Earliest/latest schedule_item start/end across a plan, or null if none are scheduled. */
export function getScheduleDateRange(scheduleItems: Array<{ start: string; end: string }>): {
  start: Date | null;
  end: Date | null;
} {
  if (scheduleItems.length === 0) return { start: null, end: null };
  const starts = scheduleItems.map((s) => new Date(s.start).getTime()).filter((t) => !Number.isNaN(t));
  const ends = scheduleItems.map((s) => new Date(s.end).getTime()).filter((t) => !Number.isNaN(t));
  if (starts.length === 0 || ends.length === 0) return { start: null, end: null };
  return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) };
}

/**
 * A signed *change*: "+3.2%", "-63.8%". Only for deltas, where the direction is
 * the point.
 */
export function formatPercent(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

/**
 * An unsigned *level*: "87.9%". Coverage is a proportion of the whole, not a
 * movement, and rendering it as "+87.9%" reads as a gain over some earlier
 * figure that does not exist.
 */
export function formatPercentValue(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function mapReasonCodeToLabel(code: string): { label: string; tone: "good" | "warn" | "neutral" | "bad" } {
  switch (code) {
    case "PRIORITY_FIT":
      return { label: "High priority window fit", tone: "good" };
    case "SHARED_POSSESSION":
      return { label: "Joint multi-dept possession", tone: "good" };
    case "TRAIN_PATH_FIT":
      return { label: "Compatible with train timetable", tone: "good" };
    case "ISOLATION_SATISFIED":
      return { label: "Electrical & signal isolation safe", tone: "good" };
    case "RESOURCE_AVAILABLE":
      return { label: "Required crew & machinery available", tone: "good" };
    case "LOCK_PRESERVED":
      return { label: "Planner manual lock preserved", tone: "neutral" };
    case "AI_PRIORITY_HIGH":
      return { label: "AI local heuristic high priority", tone: "good" };
    case "NO_ELIGIBLE_WINDOW":
      return { label: "No available window in section", tone: "bad" };
    case "RESOURCE_CONFLICT":
      return { label: "Crew / machinery conflict", tone: "bad" };
    case "TRAIN_PATH_CONFLICT":
      return { label: "Train occupancy conflict", tone: "bad" };
    case "SECTION_CONFLICT":
      return { label: "Section occupied by higher priority job", tone: "bad" };
    case "ISOLATION_CONFLICT":
      return { label: "Safety isolation barrier conflict", tone: "bad" };
    case "RAPIDBLOCK_CANDIDATE":
      return { label: "Emergency injection candidate ready", tone: "warn" };
    default:
      return { label: code.replaceAll("_", " ").toLowerCase(), tone: "neutral" };
  }
}

export function getDepartmentLabel(dept: DepartmentType): { name: string; tag: string; color: string } {
  switch (dept) {
    case "TRACK":
      return { name: "Track Maintenance (TMS)", tag: "TMS", color: "#e4a041" };
    case "SIGNAL":
      return { name: "Signal & Telecom (SMMS)", tag: "SMMS", color: "#6587c9" };
    case "ELECTRICAL":
      return { name: "Traction & OHE (TDMS)", tag: "TDMS", color: "#5ca978" };
    case "CIVIL":
      return { name: "Civil & Works", tag: "CIVIL", color: "#b678c4" };
  }
}

export function getRunStateTone(state?: RunState): "good" | "warn" | "bad" | "neutral" {
  if (state === "OPTIMAL") return "good";
  if (state === "FEASIBLE") return "good";
  if (state === "TIMEOUT") return "warn";
  if (state === "INFEASIBLE" || state === "FAILED" || state === "INVALID") return "bad";
  return "neutral";
}

/** Safe message extraction from an unknown thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}
