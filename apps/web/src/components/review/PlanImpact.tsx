"use client";

import { useState } from "react";
import { KpiView } from "@/types";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { formatDuration } from "@/lib/utils";

interface PlanImpactProps {
  kpis: KpiView;
}

export function PlanImpact({ kpis }: PlanImpactProps) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  return (
    <div className="rn-card rn-plan-impact-card">
      <div className="rn-card-header">
        <div className="rn-card-title-group">
          <h2 className="rn-card-title">PLAN IMPACT (vs. Previous Plan)</h2>
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
        {/* Metric 1: Closure Time */}
        <div className="rn-impact-item">
          <div className="rn-impact-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="rn-impact-info">
            <span className="rn-impact-label">Closure Time</span>
            <div className="rn-impact-value green">-36%</div>
            <span className="rn-impact-sub">vs. Previous Plan</span>
          </div>
        </div>

        {/* Metric 2: Total Possessions */}
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
            <span className="rn-impact-label">Total Possessions</span>
            <div className="rn-impact-value green">-60%</div>
            <span className="rn-impact-sub">vs. Previous Plan</span>
          </div>
        </div>

        {/* Metric 3: Plan Quality */}
        <div className="rn-impact-item">
          <div className="rn-impact-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="rn-impact-info">
            <span className="rn-impact-label">Plan Quality</span>
            <div className="rn-impact-value green">Optimal</div>
            <span className="rn-impact-sub">Best balance of safety, efficiency and least disruption</span>
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

      {/* Comparison Modal */}
      <ConfirmModal
        isOpen={isCompareOpen}
        title="Baseline vs. CP-SAT Optimized Comparison"
        description="Detailed quantitative breakdown of maintenance execution efficiency under joint integrated planning."
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
                <th>Previous Siloed Plan</th>
                <th>RailNiyojan Integrated Plan</th>
                <th>Net Efficiency Gain</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Section Closures</strong></td>
                <td>390 mins ({formatDuration(390)})</td>
                <td>250 mins ({formatDuration(250)})</td>
                <td className="gain-cell"><strong>-36.0%</strong> disruption reduction</td>
              </tr>
              <tr>
                <td><strong>Total Possessions Required</strong></td>
                <td>2 separate blocks</td>
                <td>1 unified block</td>
                <td className="gain-cell"><strong>-60.0%</strong> possession count</td>
              </tr>
              <tr>
                <td><strong>Maintenance Work Done</strong></td>
                <td>26 Tasks Scheduled</td>
                <td>26 Tasks Scheduled</td>
                <td className="neutral-cell">100% Demand Fulfilled</td>
              </tr>
              <tr>
                <td><strong>Safety & Conflict Checks</strong></td>
                <td>Manual verification</td>
                <td>12 hard constraints satisfied</td>
                <td className="gain-cell">0 Conflicts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ConfirmModal>
    </div>
  );
}
