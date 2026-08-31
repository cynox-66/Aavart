"use client";

import { useState } from "react";
import { OptimizationStatus } from "@/types";

interface GlobalPlanActionsProps {
  optimizationStatus: OptimizationStatus;
  lockedJobCount: number;
  pendingIntentCount?: number;
  isApproved: boolean;
  /** state is FEASIBLE/OPTIMAL, validator passed, not already approved, not dirty */
  canApprove: boolean;
  approveBlockedReason?: string;
  isBusy: boolean;
  onReoptimize: () => Promise<void>;
  onApproveStep: () => void;
  onExport: () => Promise<void>;
  isExporting?: boolean;
  onNewVersion?: () => void;
}

export function GlobalPlanActions({
  optimizationStatus,
  lockedJobCount,
  pendingIntentCount = 0,
  isApproved,
  canApprove,
  approveBlockedReason,
  isBusy,
  onReoptimize,
  onApproveStep,
  onExport,
  isExporting = false,
  onNewVersion,
}: GlobalPlanActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked by permissions - fail quietly rather than
      // interrupting with a blocking dialog.
      setCopied(false);
    }
  };

  // Once approved, this screen is read-only: no re-optimize/approve, just
  // export/print/share and starting a new version.
  if (isApproved) {
    return (
      <div className="rn-global-plan-sidebar-block">
        <div className="rn-plan-status-card">
          <h3 className="rn-sidebar-section-heading">PLAN STATUS</h3>

          <div className="rn-locked-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="rn-locked-text">
              <strong>Plan is Locked</strong>
              <p>This plan is approved and locked. To make any changes, create a new plan version.</p>
            </div>
          </div>

          <button type="button" className="rn-btn-export-primary" onClick={onExport} disabled={isBusy || isExporting}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{isExporting ? "Exporting…" : "Export Plan (CSV)"}</span>
          </button>

          <div className="rn-status-actions-row">
            <button type="button" className="rn-btn-status-secondary" onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Report</span>
            </button>

            <button type="button" className="rn-btn-status-secondary" onClick={handleShare}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copied ? <><i aria-hidden="true" className="fi fi-ss-check-circle"></i> Link copied</> : "Share with Teams"}</span>
            </button>
          </div>

          <div className="rn-new-version-wrap">
            <button type="button" className="rn-btn-new-version" onClick={onNewVersion}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <div className="rn-new-ver-text">
                <strong>Create New Plan Version</strong>
                <small>Start a new version of this plan</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not yet approved: show the real re-optimize/approve state machine.
  return (
    <div className="rn-global-plan-sidebar-block">
      <div className="rn-plan-status-card">
        <h3 className="rn-sidebar-section-heading">PLAN STATUS</h3>

        {optimizationStatus === "UP_TO_DATE" && (
          <div className="rn-locked-notice">
            <i aria-hidden="true" className="fi fi-ss-check-circle" style={{ fontSize: "16px", color: "#16A34A", display: "flex" }}></i>
            <div className="rn-locked-text">
              <strong>Plan is up to date</strong>
              <p>No re-optimization needed.</p>
            </div>
          </div>
        )}

        {optimizationStatus === "UPDATED" && (
          <div className="rn-locked-notice">
            <i aria-hidden="true" className="fi fi-ss-check-circle" style={{ fontSize: "16px", color: "#16A34A", display: "flex" }}></i>
            <div className="rn-locked-text">
              <strong>Re-optimization complete</strong>
              <p>The plan has been recalculated with your locked jobs preserved.</p>
            </div>
          </div>
        )}

        {optimizationStatus === "UNSAVED_CONSTRAINTS" && (
          <div className="rn-global-action-wrap">
            <div className="rn-unsaved-notice">
              <strong>⚠️ Unsaved Constraints</strong>
              <p>
                {pendingIntentCount > 0
                  ? `${pendingIntentCount} move/exclusion intent${pendingIntentCount === 1 ? "" : "s"} queued.`
                  : `You have locked or changed ${lockedJobCount} job${lockedJobCount === 1 ? "" : "s"}.`} The
                plan must be recalculated before approval.
              </p>
            </div>
            <button
              type="button"
              className="rn-btn-reoptimize-full"
              onClick={onReoptimize}
              disabled={isBusy}
            >
              <div className="rn-reopt-left">
                <i aria-hidden="true" className="fi fi-br-rotate-right" style={{ fontSize: "18px", color: "inherit", display: "flex" }}></i>
                <div className="rn-reopt-text">
                  <strong>Re-Optimize Plan</strong>
                  <small>Recalculate entire plan</small>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {optimizationStatus === "REOPTIMIZING" && (
          <div className="rn-unsaved-notice">
            <strong>⚙️ Re-Optimizing...</strong>
            <p>Preserving {lockedJobCount} locked job{lockedJobCount === 1 ? "" : "s"}. Recalculating unlocked work...</p>
          </div>
        )}

        {optimizationStatus === "FAILED" && (
          <div className="rn-global-action-wrap">
            <div className="rn-unsaved-notice error">
              <strong>❌ Re-Optimization Failed</strong>
              <p>The locked constraints could not be satisfied. Check conflicting locks.</p>
            </div>
            <button
              type="button"
              className="rn-btn-reoptimize-full"
              onClick={onReoptimize}
              disabled={isBusy}
            >
              <span>Retry Re-Optimize</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="rn-btn-appr-submit"
          onClick={onApproveStep}
          disabled={!canApprove || isBusy}
          title={!canApprove ? approveBlockedReason : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>Proceed With Plan</span>
        </button>
        {!canApprove && approveBlockedReason && (
          <p className="rn-approve-blocked-hint">{approveBlockedReason}</p>
        )}
      </div>
    </div>
  );
}
