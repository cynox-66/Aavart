"use client";

import { useState } from "react";
import { PlanRunView } from "@/types";
import { CorridorMap } from "@/components/shared/CorridorMap";
import { WeeklyTimelineSummary } from "@/components/review/WeeklyTimelineSummary";
import { ExpandedTimelineModal } from "@/components/review/ExpandedTimelineModal";
import { CURRENT_REVIEWER, formatPercent } from "@/lib/utils";

interface ApprovePlanStepProps {
  plan: PlanRunView;
  onApprove: (reviewer: string, comment: string) => Promise<void>;
  onBack: () => void;
  onExport?: () => Promise<void>;
  isBusy?: boolean;
  isExporting?: boolean;
}

export function ApprovePlanStep({
  plan,
  onApprove,
  onBack,
  onExport,
  isBusy = false,
  isExporting = false,
}: ApprovePlanStepProps) {
  const [notes, setNotes] = useState("");
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const handleApproveClick = async () => {
    await onApprove(CURRENT_REVIEWER, notes);
  };

  const scheduledCount = plan.jobs.filter((j) => j.status === "SCHEDULED" || j.status === "LOCKED").length;
  const lockedCount = plan.jobs.filter((j) => j.locked).length;
  const departmentCount = new Set(plan.jobs.map((j) => j.department)).size;
  const qualityTone = plan.kpis.plan_quality === "OPTIMAL" ? "green" : plan.kpis.plan_quality === "FEASIBLE" ? "amber" : "red";

  return (
    <div className="rn-approve-workspace">
      {/* 1. Step Header */}
      <div className="planning-step-header">
        <div>
          <span className="step-kicker">STEP 05 / FINAL AUTHORIZATION</span>
          <h2>Review &amp; Approve Plan</h2>
          <p className="step-desc">
            Confirm the optimized schedule for <strong>{plan.snapshot_id}</strong> meets
            safety and operational requirements. Once approved, it will be locked and exported for operational review.
          </p>
        </div>
      </div>

      {/* 2. KPI Metric Cards - real values from this run's kpis */}
      <div className="rn-kpi-cards-row">
        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Plan Quality</span>
            <div className={`rn-kpi-card-value ${qualityTone}`}>{plan.kpis.plan_quality}</div>
            <span className="rn-kpi-card-sub">Solver state: {plan.state}</span>
          </div>
        </div>

        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <line x1="6" y1="3" x2="6" y2="21" />
              <line x1="18" y1="3" x2="18" y2="21" />
              <line x1="6" y1="7" x2="18" y2="7" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Jobs Locked</span>
            <div className="rn-kpi-card-value dark">{lockedCount}</div>
            <span className="rn-kpi-card-sub">of {plan.jobs.length} total jobs</span>
          </div>
        </div>

        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Closure Time</span>
            <div className={`rn-kpi-card-value ${plan.kpis.closure_reduction_percent >= 0 ? "green" : "red"}`}>
              {formatPercent(-plan.kpis.closure_reduction_percent)}
            </div>
            <span className="rn-kpi-card-sub">{plan.kpis.closure_minutes_saved} minutes saved</span>
          </div>
        </div>

        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Coverage</span>
            <div className="rn-kpi-card-value dark">{formatPercent(plan.kpis.maintenance_coverage_percent)}</div>
            <span className="rn-kpi-card-sub">{scheduledCount} scheduled / {plan.unscheduled_jobs.length} unscheduled</span>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Split */}
      <div className="rn-approve-main-grid">
        <div className="rn-approve-left-col">
          <div className="rn-approve-top-row">
            <div className="rn-card rn-approve-corridor-card">
              <h2 className="rn-card-title">CORRIDOR OVERVIEW</h2>
              <CorridorMap sections={plan.sections} />
            </div>

            <div className="rn-card rn-approve-details-card">
              <h2 className="rn-card-title">KEY DETAILS</h2>
              <div className="rn-key-details-list">
                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Departments Involved</span>
                  </div>
                  <strong className="rn-detail-val">{departmentCount}</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Jobs Locked</span>
                  </div>
                  <strong className="rn-detail-val">{lockedCount}</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Independent Validator</span>
                  </div>
                  <strong className="rn-detail-val">{plan.validator.passed ? "Passed" : "Issues flagged"}</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Ruleset Version</span>
                  </div>
                  <strong className="rn-detail-val">{plan.ruleset_version}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Timeline Overview - reused real component, not a duplicated hardcoded copy */}
          <WeeklyTimelineSummary
            plan={plan}
            selectedJobId={null}
            onSelectJobId={() => {}}
            onExpandTimeline={() => setIsTimelineOpen(true)}
          />

          <ExpandedTimelineModal
            isOpen={isTimelineOpen}
            onClose={() => setIsTimelineOpen(false)}
            plan={plan}
            selectedJobId={null}
            onSelectJobId={() => {}}
          />
        </div>

        {/* Right Column: Readiness Checklist, Approval Notes, Actions */}
        <div className="rn-approve-right-col">
          {/* Plan Readiness Checklist - each line reflects real plan state */}
          <div className="rn-card rn-checklist-card">
            <h2 className="rn-sidebar-section-heading">PLAN READINESS CHECKLIST</h2>
            <div className="rn-checklist-items">
              <ReadinessRow
                ok={plan.validator.passed}
                title="Independent validator passed"
                detail={plan.validator.passed ? "No blocking issues found" : "Issues were flagged - review before approving"}
              />
              <ReadinessRow
                ok={plan.unscheduled_jobs.length === 0}
                title="All maintenance tasks scheduled"
                detail={`${scheduledCount} / ${plan.jobs.length} tasks planned`}
              />
              <ReadinessRow
                ok={plan.state === "OPTIMAL" || plan.state === "FEASIBLE"}
                title="Solver reached a usable solution"
                detail={`Solver state: ${plan.state}`}
              />
              <ReadinessRow
                ok={lockedCount > 0}
                title="Priority jobs reviewed"
                detail={`${lockedCount} works locked`}
              />
              <ReadinessRow
                ok={plan.kpis.maintenance_coverage_percent > 0}
                title="Coverage reviewed alongside closure reduction"
                detail={`Coverage ${formatPercent(plan.kpis.maintenance_coverage_percent)} with closure change ${formatPercent(-plan.kpis.closure_reduction_percent)}`}
              />
            </div>
          </div>

          {/* Approval Notes */}
          <div className="rn-card rn-approval-notes-card">
            <h2 className="rn-sidebar-section-heading">APPROVAL NOTES (Optional)</h2>
            <div className="rn-notes-wrap">
              <textarea
                rows={4}
                className="rn-notes-textarea"
                placeholder="Add any notes or comments about this plan..."
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="rn-char-counter">{notes.length} / 500</span>
            </div>
          </div>

          {/* Actions Box */}
          <div className="rn-card rn-appr-actions-card">
            <h2 className="rn-sidebar-section-heading">ACTIONS</h2>

            <div className="rn-appr-actions-stack">
              <button
                type="button"
                className="rn-btn-appr-back"
                onClick={onBack}
                disabled={isBusy}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to Review Plan</span>
              </button>

              <button
                type="button"
                className="rn-btn-appr-export"
                onClick={onExport}
                disabled={isBusy || isExporting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{isExporting ? "Exporting…" : "Export Plan (CSV)"}</span>
              </button>

              <button
                type="button"
                className="rn-btn-appr-submit"
                onClick={handleApproveClick}
                disabled={isBusy}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{isBusy ? "Approving..." : "Approve Plan"}</span>
              </button>

              <div className="rn-lock-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Once approved, the plan will be locked and ready for export.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="rn-check-row">
      <div className="rn-check-circle">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ok ? "#16A34A" : "#DC2626"} strokeWidth="3.5">
          {ok ? <polyline points="20 6 9 17 4 12" /> : <line x1="18" y1="6" x2="6" y2="18" />}
        </svg>
      </div>
      <div className="rn-check-text">
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}
