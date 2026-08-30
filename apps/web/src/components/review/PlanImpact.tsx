"use client";

import { useState } from "react";
import { KpiView } from "@/types";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { formatDuration, formatPercent } from "@/lib/utils";

interface PlanImpactProps {
  kpis: KpiView;
  jobCounts: { total: number; scheduled: number; unscheduled: number };
  validatorPassed: boolean;
}

const QUALITY_LABEL: Record<KpiView["plan_quality"], { label: string; tone: "green" | "amber" | "red" }> = {
  OPTIMAL: { label: "Optimal", tone: "green" },
  FEASIBLE: { label: "Feasible", tone: "amber" },
  DEGRADED: { label: "Degraded", tone: "red" },
};

export function PlanImpact({ kpis, jobCounts, validatorPassed }: PlanImpactProps) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const quality = QUALITY_LABEL[kpis.plan_quality];

  return (
    <div className="rn-card rn-plan-impact-card">
      <div className="rn-card-header">
        <div className="rn-card-title-group">
          <h2 className="rn-card-title">PLAN IMPACT</h2>
          <button
            type="button"
            className="rn-info-icon-btn"
            title={
              "The solver maximises priority-weighted job count; it has no closure term. " +
              "Closure reduction is a measured outcome of that objective, not the quantity " +
              "being optimised. Both columns cover the scheduled jobs only - read them with " +
              "Work Covered beside them."
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>
      </div>

      <div className="rn-impact-items-list">
        {/* Metric 1: Closure Time - real KPI from the solver */}
        <div className="rn-impact-item">
          <div className="rn-impact-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="rn-impact-info">
            <span className="rn-impact-label">Section Closure Time</span>
            <div className={`rn-impact-value ${kpis.downtime_reduction_percent > 0 ? "green" : ""}`}>
              {formatPercent(-kpis.downtime_reduction_percent)}
            </div>
            <span className="rn-impact-sub">
              {formatDuration(kpis.optimized_closure_minutes)} vs.{" "}
              {formatDuration(kpis.serial_baseline_closure_minutes)} one possession per job
            </span>
          </div>
        </div>

        {/* Metric 2: Asset downtime reduction - real KPI from the solver */}
        <div className="rn-impact-item">
          <div className="rn-impact-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <line x1="6" y1="3" x2="6" y2="21" />
              <line x1="18" y1="3" x2="18" y2="21" />
              <line x1="6" y1="7" x2="18" y2="7" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div className="rn-impact-info">
            <span className="rn-impact-label">Asset Downtime</span>
            <div className={`rn-impact-value ${kpis.asset_downtime_reduction_percent > 0 ? "green" : ""}`}>
              {formatPercent(-kpis.asset_downtime_reduction_percent)}
            </div>
            <span className="rn-impact-sub">
              {formatDuration(kpis.optimized_asset_downtime_minutes)} vs.{" "}
              {formatDuration(kpis.serial_baseline_asset_downtime_minutes)} one possession per job
            </span>
          </div>
        </div>

        {/*
          Coverage, as a headline rather than a footnote. The reduction above is
          measured over the scheduled jobs only, so it says nothing about the work
          this plan refused - these two numbers only mean something together.
        */}
        <div className="rn-impact-item">
          <div className="rn-impact-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="rn-impact-info">
            <span className="rn-impact-label">Work Covered</span>
            <div className={`rn-impact-value ${kpis.job_coverage_percent >= 100 ? "green" : "amber"}`}>
              {kpis.job_coverage_percent.toFixed(1)}%
            </div>
            <span className="rn-impact-sub">
              {kpis.scheduled_jobs} of {kpis.total_jobs} jobs ·{" "}
              {kpis.minute_coverage_percent.toFixed(1)}% of maintenance minutes
            </span>
          </div>
        </div>

        {/* Metric 3: Plan Quality - real solver state */}
        <div className="rn-impact-item">
          <div className="rn-impact-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="rn-impact-info">
            <span className="rn-impact-label">Plan Quality</span>
            <div className={`rn-impact-value ${quality.tone}`}>{quality.label}</div>
            <span className="rn-impact-sub">
              Independent validator {validatorPassed ? "passed" : "flagged issues"}
            </span>
          </div>
        </div>
      </div>

      <div className="rn-impact-footer">
        <button
          type="button"
          className="rn-btn-link-comparison"
          onClick={() => setIsCompareOpen(true)}
        >
          <span>View Detailed Comparison</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Comparison Modal - every figure is a real KPI/count from this run */}
      <ConfirmModal
        isOpen={isCompareOpen}
        title="Serial baseline vs. CP-SAT optimized"
        description="Both columns cover the scheduled jobs only. The baseline is one possession per job, stacked back to back within each section - not a human-authored plan."
        confirmLabel="Close"
        cancelLabel="Back"
        onConfirm={() => setIsCompareOpen(false)}
        onCancel={() => setIsCompareOpen(false)}
      >
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Operational Metric</th>
                <th>Serial baseline</th>
                <th>Optimized</th>
                <th>Net Change</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Section Closures</strong></td>
                <td>{formatDuration(kpis.serial_baseline_closure_minutes)}</td>
                <td>{formatDuration(kpis.optimized_closure_minutes)}</td>
                <td className={kpis.downtime_reduction_percent > 0 ? "gain-cell" : "neutral-cell"}>
                  <strong>{formatPercent(-kpis.downtime_reduction_percent)}</strong>
                </td>
              </tr>
              <tr>
                <td><strong>Asset Downtime</strong></td>
                <td>{formatDuration(kpis.serial_baseline_asset_downtime_minutes)}</td>
                <td>{formatDuration(kpis.optimized_asset_downtime_minutes)}</td>
                <td className={kpis.asset_downtime_reduction_percent > 0 ? "gain-cell" : "neutral-cell"}>
                  <strong>{formatPercent(-kpis.asset_downtime_reduction_percent)}</strong>
                </td>
              </tr>
              <tr>
                <td><strong>Maintenance Work Done</strong></td>
                <td colSpan={2}>{jobCounts.scheduled} / {jobCounts.total} tasks scheduled</td>
                <td className="neutral-cell">{jobCounts.unscheduled} unscheduled</td>
              </tr>
              <tr>
                <td><strong>Scheduled vs. Rejected Minutes</strong></td>
                <td>{formatDuration(kpis.scheduled_maintenance_minutes)} scheduled</td>
                <td>{formatDuration(kpis.rejected_maintenance_minutes)} rejected</td>
                <td className="neutral-cell">—</td>
              </tr>
              <tr>
                <td><strong>Safety & Conflict Checks</strong></td>
                <td colSpan={2}>Independent validator</td>
                <td className={validatorPassed ? "gain-cell" : "neutral-cell"}>
                  {validatorPassed ? "Passed" : "Issues flagged"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ConfirmModal>
    </div>
  );
}
