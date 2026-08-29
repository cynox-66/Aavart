"use client";

import { useState } from "react";

import baselineDataset from "../../../../fixtures/baseline_valid/dataset.json";
import {
  ApiError,
  approveRun,
  createPlanningRun,
  downloadRun,
  lockScheduleItem,
  replanRun,
  type RunDetail,
  validateDataset,
  type ValidationResponse,
} from "@/lib/api";

type BusyAction = "validate" | "plan" | "lock" | "replan" | "approve" | "export" | null;

export function PlannerDashboard() {
  const [dataset, setDataset] = useState<unknown>(baselineDataset);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [reviewer, setReviewer] = useState("akash");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);

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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setDataset(JSON.parse(String(reader.result)));
        setValidation(null);
        setRun(null);
        setError(null);
      } catch {
        setError("INVALID_INPUT: Selected file is not valid JSON");
      }
    };
    reader.readAsText(file);
  }

  const jobs = new Map(run?.jobs.map((job) => [job.job_id, job]));
  const replanItem = run?.schedule_items.find((item) => item.locked) ?? run?.schedule_items[0];
  const replanSection = replanItem ? jobs.get(replanItem.job_id)?.section_id : undefined;

  return (
    <section className="workspace" aria-labelledby="workspace-title">
      <div className="workspace-heading">
        <div>
          <p className="section-number">01 / Planning desk</p>
          <h2 id="workspace-title">Build a reviewable block plan</h2>
        </div>
        <div className="scope-note">One corridor / One week / Demo Ruleset v1</div>
      </div>

      <div className="control-rail">
        <label className="file-control">
          <span>Input dataset</span>
          <input type="file" accept="application/json,.json" onChange={(event) => readFile(event.target.files?.[0])} />
          <small>Bundled baseline is loaded. Choose JSON to replace it.</small>
        </label>
        <button
          onClick={() => perform("validate", async () => {
            const result = await validateDataset(dataset);
            setValidation(result);
            setRun(null);
          })}
          disabled={busy !== null}
        >
          {busy === "validate" ? "Validating..." : "1. Validate dataset"}
        </button>
        <button
          onClick={() => perform("plan", async () => {
            if (validation?.snapshot_candidate_id) setRun(await createPlanningRun(validation.snapshot_candidate_id));
          })}
          disabled={busy !== null || !validation?.valid}
        >
          {busy === "plan" ? "Planning..." : "2. Create plan"}
        </button>
      </div>

      {error && <p className="error-banner" role="alert">{error}</p>}

      {validation && (
        <div className={`validation-card ${validation.valid ? "valid" : "invalid"}`}>
          <strong>{validation.valid ? "Dataset valid" : "Dataset rejected"}</strong>
          <span>{validation.counts.jobs} jobs / {validation.counts.windows} windows / {validation.counts.sections} sections</span>
          {validation.errors.map((issue) => (
            <p key={`${issue.field}-${issue.message}`}>{issue.code} / row {issue.row ?? "-"} / {issue.field}: {issue.message}</p>
          ))}
        </div>
      )}

      {run && (
        <div className="run-board">
          <header className="run-header">
            <div>
              <p className="mono">{run.run_id}</p>
              <h3>Planning result</h3>
            </div>
            <span className={`state state-${run.state.toLowerCase()}`}>{run.state}</span>
          </header>

          <div className="run-facts">
            <span>Snapshot <b>{run.snapshot_id}</b></span>
            <span>Validator <b>{run.validator.passed ? "PASSED" : "FAILED"}</b></span>
            <span>Approval <b>{run.approval ? run.approval.reviewer : "PENDING"}</b></span>
          </div>

          <div className="schedule-list">
            {run.schedule_items.map((item) => {
              const job = jobs.get(item.job_id);
              return (
                <article className="schedule-row" key={item.job_id}>
                  <div className="job-key"><strong>{item.job_id}</strong><span>{job?.department}</span></div>
                  <div><span>{job?.section_id} / {job?.asset_id}</span><strong>{job?.work_type}</strong></div>
                  <div><span>{item.window_id}</span><strong>{new Date(item.start).toLocaleString()} to {new Date(item.end).toLocaleTimeString()}</strong></div>
                  <div className="reason"><span>{run.changes[item.job_id]}</span><strong>{item.reason_codes.join(", ")}</strong></div>
                  <button
                    className="small-button"
                    disabled={busy !== null || item.locked}
                    onClick={() => perform("lock", async () => setRun(await lockScheduleItem(run.run_id, item.job_id)))}
                  >
                    {item.locked ? "Locked" : "Lock"}
                  </button>
                </article>
              );
            })}
          </div>

          {run.unscheduled_jobs.length > 0 && (
            <div className="rejections">
              <p className="mono">Unscheduled with reasons</p>
              {run.unscheduled_jobs.map((item) => (
                <div key={item.job_id}><strong>{item.job_id}</strong><span>{item.reason_codes.join(", ")}</span></div>
              ))}
            </div>
          )}

          <div className="approval-bar">
            <button
              disabled={busy !== null || !replanItem || !replanSection}
              onClick={() => perform("replan", async () => {
                if (replanItem && replanSection) {
                  setRun(await replanRun(run.run_id, [replanSection], [replanItem.window_id]));
                }
              })}
            >
              {busy === "replan" ? "Re-planning..." : "3. Re-plan affected work"}
            </button>
            <label><span>Reviewer</span><input value={reviewer} onChange={(event) => setReviewer(event.target.value)} /></label>
            <button disabled={busy !== null || !reviewer.trim() || Boolean(run.approval) || !run.validator.passed} onClick={() => perform("approve", async () => setRun(await approveRun(run.run_id, reviewer)))}>
              {run.approval ? "Approved" : busy === "approve" ? "Approving..." : "4. Approve"}
            </button>
            <button disabled={busy !== null || !run.export_ready} onClick={() => perform("export", () => downloadRun(run.run_id))}>
              5. Export CSV
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
