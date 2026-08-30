"use client";

import { useMemo, useState, type DragEvent } from "react";

import baselineDataset from "../../../../fixtures/baseline_valid/dataset.json";
import {
  ApiError,
  approveRun,
  createPlanningRun,
  downloadRun,
  lockScheduleItem,
  replanRun,
  type JobContext,
  type RunDetail,
  type ScheduleItem,
  validateDataset,
  type ValidationResponse,
} from "@/lib/api";

type BusyAction = "upload" | "validate" | "plan" | "lock" | "replan" | "approve" | "export" | null;
type SourceFormat = "JSON" | "CSV" | "FIXTURE";
type UploadState = "idle" | "uploading" | "valid" | "invalid" | "warning" | "ready-to-plan";
type DatasetSource = {
  name: string;
  format: SourceFormat;
  payload: unknown;
};

const baselineSource: DatasetSource = {
  name: "baseline_valid/dataset.json",
  format: "FIXTURE",
  payload: baselineDataset,
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PlannerDashboard() {
  const [source, setSource] = useState<DatasetSource>(baselineSource);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [reviewer, setReviewer] = useState("akash");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("JOB-001");
  const [rapidOpen, setRapidOpen] = useState(false);

  async function perform(action: Exclude<BusyAction, null>, task: () => Promise<void>) {
    setBusy(action);
    setError(null);
    try {
      await task();
    } catch (caught) {
      setError(caught instanceof ApiError ? `${caught.code}: ${caught.message}` : "Unexpected request failure");
    } finally {
      setBusy(null);
    }
  }

  function readFile(file: File | undefined) {
    if (!file) return;
    setBusy("upload");
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const lowerName = file.name.toLowerCase();
      try {
        const format: SourceFormat = lowerName.endsWith(".csv") ? "CSV" : "JSON";
        const payload = format === "CSV" ? text : JSON.parse(text);
        setSource({ name: file.name, format, payload });
        setValidation(null);
        setRun(null);
        setSelectedJobId("");
        setError(null);
      } catch {
        setError("INVALID_INPUT: Selected file is not valid JSON");
      } finally {
        setBusy(null);
      }
    };
    reader.onerror = () => {
      setBusy(null);
      setError("INVALID_INPUT: Could not read selected file");
    };
    reader.readAsText(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    readFile(event.dataTransfer.files[0]);
  }

  const jobs = useMemo(() => new Map(run?.jobs.map((job) => [job.job_id, job])), [run]);
  const scheduleByJob = useMemo(() => new Map(run?.schedule_items.map((item) => [item.job_id, item])), [run]);
  const selectedJob = (selectedJobId && jobs.get(selectedJobId)) || run?.jobs[0] || null;
  const selectedSchedule = selectedJob ? scheduleByJob.get(selectedJob.job_id) : undefined;
  const replanItem = selectedSchedule ?? run?.schedule_items.find((item) => item.locked) ?? run?.schedule_items[0];
  const replanSection = replanItem ? jobs.get(replanItem.job_id)?.section_id : undefined;
  const unscheduledIds = new Set(run?.unscheduled_jobs.map((item) => item.job_id));
  const lockedItems = run?.schedule_items.filter((item) => item.locked) ?? [];
  const changedItems = run?.schedule_items.filter((item) => run.changes[item.job_id] === "CHANGED") ?? [];
  const uploadState: UploadState =
    busy === "upload" || busy === "validate"
      ? "uploading"
      : validation?.valid && !run
        ? "ready-to-plan"
        : validation?.valid
          ? "valid"
          : validation && validation.errors.length > 0
            ? "invalid"
            : validation
              ? "warning"
              : "idle";
  const sourceIsCompact = Boolean(validation?.valid);

  return (
    <section className="mission" aria-labelledby="workspace-title">
      <header className="mission-topline">
        <div>
          <p className="section-number">01 / Rail Mission Control</p>
          <h2 id="workspace-title">Build a reviewable block plan</h2>
        </div>
        <div className="backend-strip" aria-label="Backend state">
          <TruthPill label="Run" value={run?.state ?? (validation?.valid ? "READY" : "NO RUN")} tone={stateTone(run?.state)} />
          <TruthPill label="Snapshot" value={run?.snapshot_id ?? validation?.snapshot_candidate_id ?? "UNVALIDATED"} />
          <TruthPill label="Ruleset" value={run?.ruleset_version ?? "Demo Ruleset v1"} />
          <TruthPill label="Validator" value={run ? (run.validator.passed ? "PASSED" : "FAILED") : validation?.valid ? "CANDIDATE" : "PENDING"} tone={run?.validator.passed || validation?.valid ? "good" : validation ? "bad" : "neutral"} />
          <TruthPill label="Approval" value={run?.approval ? run.approval.reviewer : "BLOCKED"} tone={run?.approval ? "good" : "neutral"} />
          <TruthPill label="Export" value={run?.export_ready ? "READY" : "LOCKED"} tone={run?.export_ready ? "good" : "neutral"} />
        </div>
      </header>

      <label
        className={`source-gate ${sourceIsCompact ? "compact" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input type="file" accept="application/json,text/csv,.json,.csv" onChange={(event) => readFile(event.target.files?.[0])} />
        <span className="drop-kicker">{uploadState.replaceAll("-", " ")}</span>
        <strong>{sourceIsCompact ? source.name : "Drop controlled CSV or JSON dataset"}</strong>
        <small>{source.format} source / SVG remains preview fixture only / {validation ? `${validation.counts.jobs} jobs, ${validation.counts.windows} windows` : "baseline fixture loaded"}</small>
      </label>

      <div className="command-bar">
        <button
          onClick={() => perform("validate", async () => {
            const result = await validateDataset(source.payload, source.format === "CSV" ? "text/csv" : "application/json");
            setValidation(result);
            setRun(null);
            if (result.valid) setSelectedJobId("");
          })}
          disabled={busy !== null}
        >
          {busy === "validate" ? "Validating..." : "1. Validate dataset"}
        </button>
        <button
          onClick={() => perform("plan", async () => {
            if (validation?.snapshot_candidate_id) {
              const nextRun = await createPlanningRun(validation.snapshot_candidate_id);
              setRun(nextRun);
              setSelectedJobId(nextRun.schedule_items[0]?.job_id ?? nextRun.jobs[0]?.job_id ?? "");
            }
          })}
          disabled={busy !== null || !validation?.valid}
        >
          {busy === "plan" ? "Planning..." : "2. Create plan"}
        </button>
        <button type="button" className="secondary-action" onClick={() => setRapidOpen((open) => !open)} disabled={!run}>
          Rapid Re-Plan
        </button>
      </div>

      {error && <p className="error-banner" role="alert">{error}</p>}

      {validation && (
        <div className={`validation-card ${validation.valid ? "valid" : "invalid"}`}>
          <strong>{validation.valid ? "Dataset valid" : "Dataset rejected"}</strong>
          <span>{validation.counts.jobs} jobs / {validation.counts.windows} windows / {validation.counts.sections} sections / snapshot {validation.snapshot_candidate_id ?? "-"}</span>
          {validation.errors.map((issue) => (
            <p key={`${issue.field}-${issue.message}`}>{issue.code} / row {issue.row ?? "-"} / {issue.field}: {issue.message}</p>
          ))}
        </div>
      )}

      {run ? (
        <div className="ops-grid">
          <JobExplorer
            run={run}
            selectedJobId={selectedJob?.job_id ?? ""}
            onSelect={setSelectedJobId}
          />
          <main className="atlas-pane">
            <CorridorSchematic
              run={run}
              selectedJobId={selectedJob?.job_id ?? ""}
              onSelect={setSelectedJobId}
            />
            <WeeklyGantt
              run={run}
              selectedJobId={selectedJob?.job_id ?? ""}
              onSelect={setSelectedJobId}
            />
          </main>
          <Inspector
            run={run}
            job={selectedJob}
            schedule={selectedSchedule}
            unscheduledReasonCodes={run.unscheduled_jobs.find((item) => item.job_id === selectedJob?.job_id)?.reason_codes}
            reviewer={reviewer}
            onReviewerChange={setReviewer}
            busy={busy}
            onLock={() => {
              if (!selectedSchedule) return;
              perform("lock", async () => setRun(await lockScheduleItem(run.run_id, selectedSchedule.job_id)));
            }}
            onApprove={() => perform("approve", async () => setRun(await approveRun(run.run_id, reviewer, "Reviewed schedule and independent validator result")))}
            onExport={() => perform("export", () => downloadRun(run.run_id))}
          />
        </div>
      ) : (
        <div className="empty-desk">
          <div>
            <p className="mono">Planning desk waiting</p>
            <strong>Validate a snapshot, then create the first run.</strong>
          </div>
          <span>Corridor schematic, weekly Gantt, reason codes, approvals, and export gates appear after backend truth exists.</span>
        </div>
      )}

      {run && rapidOpen && (
        <aside className="rapid-drawer" aria-label="Rapid Re-Plan">
          <div>
            <p className="mono">Candidate-only drawer</p>
            <h3>RapidBlock lineage</h3>
          </div>
          <div className="rapid-lineage">
            <TruthPill label="Parent" value={run.parent_run_id ?? run.run_id} />
            <TruthPill label="Child" value={run.parent_run_id ? run.run_id : "NOT CREATED"} />
            <TruthPill label="Locked kept" value={lockedItems.length.toString()} tone={lockedItems.length ? "good" : "neutral"} />
            <TruthPill label="Changed" value={changedItems.length.toString()} tone={changedItems.length ? "warn" : "neutral"} />
          </div>
          <button
            disabled={busy !== null || !replanItem || !replanSection}
            onClick={() => perform("replan", async () => {
              if (replanItem && replanSection) {
                const nextRun = await replanRun(run.run_id, {
                  affected_section_ids: [replanSection],
                  affected_window_ids: [replanItem.window_id],
                  actor: "planner",
                  reason: "planner requested re-optimization",
                  locked_job_ids: run.schedule_items.filter((item) => item.locked).map((item) => item.job_id),
                });
                setRun(nextRun);
                setSelectedJobId(replanItem.job_id);
              }
            })}
          >
            {busy === "replan" ? "Re-planning..." : "3. Re-plan affected work"}
          </button>
          <div className="rapid-note">
            <strong>Preserved locked items</strong>
            <span>{lockedItems.map((item) => item.job_id).join(", ") || "No accepted locks yet"}</span>
          </div>
        </aside>
      )}

      <span className="sr-only">{unscheduledIds.size} unscheduled jobs include reason codes.</span>
    </section>
  );
}

function TruthPill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" | "warn" }) {
  return (
    <span className={`truth-pill ${tone}`}>
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

function JobExplorer({ run, selectedJobId, onSelect }: { run: RunDetail; selectedJobId: string; onSelect: (jobId: string) => void }) {
  const scheduled = run.schedule_items.filter((item) => !item.locked);
  const locked = run.schedule_items.filter((item) => item.locked);
  const conflicting = run.schedule_items.filter((item) => item.reason_codes.some((code) => code.includes("CONFLICT")));

  return (
    <aside className="job-explorer" aria-label="Job Explorer">
      <PanelTitle kicker="Left pane" title="Job Explorer" />
      <JobGroup title="Scheduled" items={scheduled} run={run} selectedJobId={selectedJobId} onSelect={onSelect} />
      <JobGroup title="Locked" items={locked} run={run} selectedJobId={selectedJobId} onSelect={onSelect} />
      <JobGroup title="Conflicting" items={conflicting} run={run} selectedJobId={selectedJobId} onSelect={onSelect} />
      <div className="job-group">
        <h4>Unscheduled</h4>
        {run.unscheduled_jobs.map((item) => (
          <button
            className={`job-card rejected ${selectedJobId === item.job_id ? "selected" : ""}`}
            key={item.job_id}
            onClick={() => onSelect(item.job_id)}
          >
            <span>{item.job_id}</span>
            <strong>{item.reason_codes.join(", ")}</strong>
          </button>
        ))}
        {run.unscheduled_jobs.length === 0 && <p className="empty-copy">No rejected jobs in this run.</p>}
      </div>
    </aside>
  );
}

function JobGroup({ title, items, run, selectedJobId, onSelect }: { title: string; items: ScheduleItem[]; run: RunDetail; selectedJobId: string; onSelect: (jobId: string) => void }) {
  const jobs = new Map(run.jobs.map((job) => [job.job_id, job]));
  return (
    <div className="job-group">
      <h4>{title}</h4>
      {items.map((item) => {
        const job = jobs.get(item.job_id);
        return (
          <button
            className={`job-card ${selectedJobId === item.job_id ? "selected" : ""} ${run.changes[item.job_id]?.toLowerCase() ?? ""}`}
            key={`${title}-${item.job_id}`}
            onClick={() => onSelect(item.job_id)}
          >
            <span>{item.job_id} / {job?.department}</span>
            <strong>{job?.section_id} to {item.window_id}</strong>
            <small>{item.status} / {item.reason_codes.join(", ")}</small>
          </button>
        );
      })}
      {items.length === 0 && <p className="empty-copy">None</p>}
    </div>
  );
}

function CorridorSchematic({ run, selectedJobId, onSelect }: { run: RunDetail; selectedJobId: string; onSelect: (jobId: string) => void }) {
  const sections = Array.from(new Set(run.jobs.map((job) => job.section_id)));
  const points = sections.map((section, index) => ({
    section,
    x: 80 + index * (720 / Math.max(sections.length, 1)),
    y: index % 2 === 0 ? 120 : 210,
  }));

  return (
    <section className="schematic-panel">
      <PanelTitle kicker="Center pane / where" title="Corridor schematic" />
      <svg viewBox="0 0 900 330" role="img" aria-label="Route-like corridor schematic with planned job nodes">
        <defs>
          <linearGradient id="routeAmber" x1="0" x2="1">
            <stop offset="0" stopColor="#f5c15e" />
            <stop offset="1" stopColor="#c77534" />
          </linearGradient>
        </defs>
        <path className="waterline" d="M20 270 C180 210 280 295 430 230 S690 235 870 170" />
        <path className="route-shadow" d={routePath(points)} />
        <path className="route-main" d={routePath(points)} />
        {points.map((point, index) => (
          <g key={point.section}>
            <circle className="station-ring" cx={point.x} cy={point.y} r="13" />
            <text x={point.x} y={point.y - 24} textAnchor="middle">{point.section}</text>
            <text x={point.x} y={point.y + 38} textAnchor="middle">NODE {index + 1}</text>
          </g>
        ))}
        {run.jobs.map((job, index) => {
          const point = points.find((item) => item.section === job.section_id) ?? points[0];
          const schedule = run.schedule_items.find((item) => item.job_id === job.job_id);
          const isSelected = selectedJobId === job.job_id;
          const dx = (index % 3) * 28 - 28;
          const y = (point?.y ?? 160) + (schedule ? 0 : 58);
          return (
            <g
              className={`job-node ${isSelected ? "selected" : ""} ${schedule ? "scheduled" : "rejected"}`}
              key={job.job_id}
              onClick={() => onSelect(job.job_id)}
              tabIndex={0}
              role="button"
            >
              <circle cx={(point?.x ?? 80) + dx} cy={y} r={isSelected ? 12 : 9} />
              <text x={(point?.x ?? 80) + dx} y={y - 18} textAnchor="middle">{job.job_id}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function WeeklyGantt({ run, selectedJobId, onSelect }: { run: RunDetail; selectedJobId: string; onSelect: (jobId: string) => void }) {
  const rows = Array.from(new Set(run.jobs.map((job) => job.section_id)));
  const jobs = new Map(run.jobs.map((job) => [job.job_id, job]));

  return (
    <section className="gantt-panel">
      <PanelTitle kicker="Center pane / when" title="Weekly block timeline" />
      <div className="gantt-grid">
        <div className="gantt-corner">Section</div>
        {dayLabels.map((day) => <div className="gantt-day" key={day}>{day}</div>)}
        {rows.map((section) => (
          <div className="gantt-row" key={section}>
            <div className="gantt-section">{section}</div>
            <div className="gantt-track">
              {run.schedule_items.filter((item) => jobs.get(item.job_id)?.section_id === section).map((item) => (
                <button
                  className={`gantt-bar ${selectedJobId === item.job_id ? "selected" : ""} ${item.locked ? "locked" : ""} ${run.changes[item.job_id]?.toLowerCase() ?? ""}`}
                  key={item.job_id}
                  style={barStyle(item)}
                  onClick={() => onSelect(item.job_id)}
                >
                  <span>{item.job_id}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Inspector({
  run,
  job,
  schedule,
  unscheduledReasonCodes,
  reviewer,
  onReviewerChange,
  busy,
  onLock,
  onApprove,
  onExport,
}: {
  run: RunDetail;
  job: JobContext | null;
  schedule: ScheduleItem | undefined;
  unscheduledReasonCodes: string[] | undefined;
  reviewer: string;
  onReviewerChange: (value: string) => void;
  busy: BusyAction;
  onLock: () => void;
  onApprove: () => void;
  onExport: () => void;
}) {
  const estimate = run.ai_estimates.find((item) => item.job_id === job?.job_id);
  const reasonCodes = schedule?.reason_codes ?? unscheduledReasonCodes ?? estimate?.reason_codes ?? [];

  return (
    <aside className="inspector" aria-label="Inspector">
      <PanelTitle kicker="Right pane / why" title="Inspector" />
      <div className="inspector-focus">
        <span>{job?.department ?? "NO SELECTION"}</span>
        <strong>{job?.job_id ?? "Select a job"}</strong>
        <small>{job ? `${job.section_id} / ${job.asset_id} / P${job.priority}` : "Schematic, Gantt, and explorer selections sync here."}</small>
      </div>
      <dl className="meta-list">
        <div><dt>Window</dt><dd>{schedule?.window_id ?? "UNSCHEDULED"}</dd></div>
        <div><dt>Time</dt><dd>{schedule ? `${formatStamp(schedule.start)} to ${formatTime(schedule.end)}` : "NO ACCEPTED SLOT"}</dd></div>
        <div><dt>Status</dt><dd>{schedule?.locked ? "LOCKED" : schedule?.status ?? "REJECTED"}</dd></div>
        <div><dt>Change</dt><dd>{job ? run.changes[job.job_id] ?? "UNSCHEDULED" : "-"}</dd></div>
        <div><dt>Validator</dt><dd>{run.validator.passed ? "PASSED" : "FAILED"} / {formatStamp(run.validator.validated_at)}</dd></div>
        <div><dt>Lineage</dt><dd>{run.parent_run_id ? `${run.parent_run_id} -> ${run.run_id}` : `${run.snapshot_id} -> ${run.run_id}`}</dd></div>
      </dl>
      <div className="reason-stack">
        <h4>Reason codes</h4>
        {reasonCodes.map((code) => <span key={code}>{code}</span>)}
        {reasonCodes.length === 0 && <span>NO_REASON_CODE</span>}
      </div>
      <div className="kpi-stack">
        <TruthPill label="Scheduled min" value={run.kpis.scheduled_maintenance_minutes.toString()} tone="good" />
        <TruthPill label="Rejected min" value={run.kpis.rejected_maintenance_minutes.toString()} tone={run.kpis.rejected_maintenance_minutes ? "warn" : "good"} />
        <TruthPill label="Coverage" value={`${run.kpis.maintenance_coverage_percent.toFixed(1)}%`} tone={run.kpis.maintenance_coverage_percent >= 80 ? "good" : "warn"} />
      </div>
      <div className="review-actions">
        <button disabled={busy !== null || !schedule || schedule.locked || schedule.status !== "SCHEDULED"} onClick={onLock}>
          {schedule?.locked ? "Locked" : busy === "lock" ? "Locking..." : "Lock accepted item"}
        </button>
        <label>
          <span>Reviewer</span>
          <input value={reviewer} onChange={(event) => onReviewerChange(event.target.value)} />
        </label>
        <button disabled={busy !== null || !reviewer.trim() || Boolean(run.approval) || !run.validator.passed} onClick={onApprove}>
          {run.approval ? "Approved" : busy === "approve" ? "Approving..." : "4. Approve"}
        </button>
        <button disabled={busy !== null || !run.export_ready} onClick={onExport}>
          5. Export CSV
        </button>
      </div>
    </aside>
  );
}

function PanelTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="panel-title">
      <p className="mono">{kicker}</p>
      <h3>{title}</h3>
    </div>
  );
}

function routePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "M80 160 L820 160";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function barStyle(item: ScheduleItem) {
  const start = new Date(item.start);
  const end = new Date(item.end);
  const day = Math.max(0, (start.getDay() + 6) % 7);
  const minutes = start.getHours() * 60 + start.getMinutes();
  const duration = Math.max(45, (end.getTime() - start.getTime()) / 60000);
  return {
    left: `${(day / 7) * 100 + (minutes / 1440 / 7) * 100}%`,
    width: `${Math.min(18, Math.max(8, (duration / 1440 / 7) * 100))}%`,
  };
}

function stateTone(state: RunDetail["state"] | undefined): "neutral" | "good" | "bad" | "warn" {
  if (state === "FEASIBLE" || state === "OPTIMAL") return "good";
  if (state === "TIMEOUT") return "warn";
  if (state === "INFEASIBLE" || state === "INVALID" || state === "FAILED") return "bad";
  return "neutral";
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
