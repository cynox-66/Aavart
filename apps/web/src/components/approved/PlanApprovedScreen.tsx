"use client";

import { useState } from "react";
import { DepartmentType, PlanRunView } from "@/types";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { formatPercent, getDepartmentLabel } from "@/lib/utils";

interface PlanApprovedScreenProps {
  plan: PlanRunView;
  onExport: () => Promise<void>;
  isExporting?: boolean;
  onNewVersion: () => void;
}

export function PlanApprovedScreen({
  plan,
  onExport,
  isExporting = false,
  onNewVersion,
}: PlanApprovedScreenProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const integratedBlockCount = plan.schedule_items.filter((s) => s.is_integrated_block).length;
  const jobCountsByDept = new Map<DepartmentType, number>();
  plan.jobs.forEach((j) => jobCountsByDept.set(j.department, (jobCountsByDept.get(j.department) ?? 0) + 1));

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rn-plan-approved-workspace">
      {/* 1. Celebration Banner */}
      <div className="rn-celebration-banner center">
        <div className="rn-confetti-circle-wrap">
          <div className="rn-confetti-dot c1" />
          <div className="rn-confetti-dot c2" />
          <div className="rn-confetti-dot c3" />
          <div className="rn-confetti-dot c4" />
          <div className="rn-confetti-dot c5" />
          <div className="rn-confetti-dot c6" />
          <div className="rn-confetti-dot c7" />
          <div className="rn-confetti-dot c8" />

          <div className="rn-big-check-circle">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="rn-celebration-text center">
          <h1 className="rn-celebration-title">Plan Approved!</h1>
          <p className="rn-celebration-subtitle">
            Plan <strong className="rn-green-snap">{plan.snapshot_id}</strong> has been approved and is ready for export.
          </p>
        </div>
      </div>

      {/* 2. 4 Stat Metrics Bar */}
      <div className="rn-stat-summary-bar">
        <div className="rn-stat-box">
          <div className="rn-stat-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div className="rn-stat-data">
            <div className="rn-stat-number">{plan.jobs.length}</div>
            <span className="rn-stat-label">Maintenance Tasks</span>
          </div>
        </div>

        <div className="rn-stat-box">
          <div className="rn-stat-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8">
              <line x1="6" y1="3" x2="6" y2="21" />
              <line x1="18" y1="3" x2="18" y2="21" />
              <line x1="6" y1="7" x2="18" y2="7" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div className="rn-stat-data">
            <div className="rn-stat-number">{integratedBlockCount}</div>
            <span className="rn-stat-label">Integrated Block{integratedBlockCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="rn-stat-box">
          <div className="rn-stat-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="rn-stat-data">
            <div className={`rn-stat-number ${plan.kpis.closure_reduction_percent >= 0 ? "green" : ""}`}>
              {formatPercent(-plan.kpis.closure_reduction_percent)}
            </div>
            <span className="rn-stat-label">Closure Time vs. Baseline</span>
          </div>
        </div>

        <div className="rn-stat-box">
          <div className="rn-stat-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="rn-stat-data">
            <div className="rn-stat-number green">{formatPercent(plan.kpis.maintenance_coverage_percent)}</div>
            <span className="rn-stat-label">Maintenance Coverage</span>
          </div>
        </div>
      </div>

      {/* 3. "What's Next?" 4 Action Cards */}
      <div className="rn-whats-next-section">
        <h2 className="rn-section-heading">What&apos;s Next?</h2>

        <div className="rn-whats-next-grid">
          {/* Tile 1: Export Plan */}
          <div className="rn-next-tile">
            <div className="rn-tile-icon-circle green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3 className="rn-tile-title">Export Plan</h3>
            <p className="rn-tile-desc">Download the approved recommendation in CSV format for operational review.</p>
            <button
              type="button"
              className="rn-btn-tile-action green"
              onClick={onExport}
              disabled={isExporting}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{isExporting ? "Exporting…" : "Export Plan"}</span>
            </button>
          </div>

          {/* Tile 2: Print Report */}
          <div className="rn-next-tile">
            <div className="rn-tile-icon-circle blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </div>
            <h3 className="rn-tile-title">Print Report</h3>
            <p className="rn-tile-desc">Print a summary report for offline records.</p>
            <button
              type="button"
              className="rn-btn-tile-action blue"
              onClick={handlePrint}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Report</span>
            </button>
          </div>

          {/* Tile 3: Share with Teams */}
          <div className="rn-next-tile">
            <div className="rn-tile-icon-circle purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <h3 className="rn-tile-title">Share with Teams</h3>
            <p className="rn-tile-desc">Share the approved plan with relevant departments.</p>
            <button
              type="button"
              className="rn-btn-tile-action purple"
              onClick={() => setIsShareModalOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share Plan</span>
            </button>
          </div>

          {/* Tile 4: Create New Plan Version */}
          <div className="rn-next-tile">
            <div className="rn-tile-icon-circle orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="rn-tile-title">Create New Plan Version</h3>
            <p className="rn-tile-desc">Make changes by creating a new version of this plan.</p>
            <button
              type="button"
              className="rn-btn-tile-action orange"
              onClick={onNewVersion}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Plan Version</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Locked Notification Banner */}
      <div className="rn-locked-banner-wide">
        <div className="rn-lock-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="rn-locked-banner-text">
          <strong>Plan is Locked</strong>
          <p>This plan is locked and approved. To make any changes, please create a new plan version.</p>
        </div>
      </div>

      {/* Share Modal */}
      <ConfirmModal
        isOpen={isShareModalOpen}
        title="Share Approved Plan with Teams"
        description={`Share weekly schedule ${plan.run_id} with Western Railway departmental desks:`}
        confirmLabel={copied ? "✓ Copied Link!" : "Copy Share Link"}
        cancelLabel="Done"
        onConfirm={handleCopyLink}
        onCancel={() => setIsShareModalOpen(false)}
      >
        <div className="share-channels-list">
          {(["TRACK", "SIGNAL", "ELECTRICAL", "CIVIL"] as DepartmentType[])
            .filter((dept) => (jobCountsByDept.get(dept) ?? 0) > 0)
            .map((dept) => {
              const count = jobCountsByDept.get(dept) ?? 0;
              const { name } = getDepartmentLabel(dept);
              return (
                <div className="share-channel-row" key={dept}>
                  <span className="channel-icon">📋</span>
                  <div>
                    <strong>{name}</strong>
                    <small>Auto-sync payload ready for {count} work order{count === 1 ? "" : "s"}</small>
                  </div>
                </div>
              );
            })}
        </div>
      </ConfirmModal>
    </div>
  );
}
