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
          <h2 className="rn-card-title">PLAN IMPACT (vs. Baseline)</h2>
          <button type="button" className="rn-info-icon-btn" title="Optimizer Impact Info">
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
            <span className="rn-impact-label">Closure Time</span>
            <div className={`rn-impact-value ${kpis.closure_reduction_percent >= 0 ? "green" : "red"}`}>
              {formatPercent(-kpis.closure_reduction_percent)}
            </div>
            <span className="rn-impact-sub">vs. baseline (unoptimized) plan</span>
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
            <div className={`rn-impact-value ${kpis.downtime_reduction_percent >= 0 ? "green" : "red"}`}>
              {formatPercent(-kpis.downtime_reduction_percent)}
            </div>
            <span className="rn-impact-sub">vs. baseline (unoptimized) plan</span>
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
              {jobCounts.scheduled} of {jobCounts.total} jobs scheduled · independent validator {validatorPassed ? "passed" : "flagged issues"}
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
        title="Baseline vs. CP-SAT Optimized Comparison"
        description="Quantitative breakdown reported by the solver for this run."
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
                <th>Baseline</th>
                <th>Optimized</th>
                <th>Net Change</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Section Closures</strong></td>
                <td>{formatDuration(kpis.baseline_closure_minutes)}</td>
                <td>{formatDuration(kpis.optimized_closure_minutes)}</td>
                <td className="gain-cell"><strong>{formatPercent(-kpis.closure_reduction_percent)}</strong></td>
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
