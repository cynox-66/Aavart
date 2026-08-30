"use client";

interface GlobalPlanActionsProps {
  isDirty: boolean;
  lockedJobCount: number;
  isApproved: boolean;
  isBusy: boolean;
  onReoptimize: () => Promise<void>;
  onApproveStep: () => void;
  onExport: () => Promise<void>;
  onNewVersion?: () => void;
}

export function GlobalPlanActions({
  isBusy,
  onReoptimize,
  onExport,
  onNewVersion,
}: GlobalPlanActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    alert("Plan link copied to clipboard for team dispatch!");
  };

  return (
    <div className="rn-global-plan-sidebar-block">
      {/* 1. Global Action: Re-Optimize Plan */}
      <div className="rn-global-action-wrap">
        <h3 className="rn-sidebar-section-heading">GLOBAL ACTION</h3>
        <button
          type="button"
          className="rn-btn-reoptimize-full"
          onClick={onReoptimize}
          disabled={isBusy}
        >
          <div className="rn-reopt-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
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

      {/* 2. Plan Status & Actions */}
      <div className="rn-plan-status-card">
        <h3 className="rn-sidebar-section-heading">PLAN STATUS</h3>

        {/* Plan is Locked notice */}
        <div className="rn-locked-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div className="rn-locked-text">
            <strong>Plan is Locked</strong>
            <p>This plan is locked. To make any changes, create a new plan version.</p>
          </div>
        </div>

        {/* Primary Action: Export Plan (PDF) */}
        <button
          type="button"
          className="rn-btn-export-primary"
          onClick={onExport}
          disabled={isBusy}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export Plan (PDF)</span>
        </button>

        {/* Secondary Row: Print Report & Share with Teams */}
        <div className="rn-status-actions-row">
          <button
            type="button"
            className="rn-btn-status-secondary"
            onClick={handlePrint}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Report</span>
          </button>

          <button
            type="button"
            className="rn-btn-status-secondary"
            onClick={handleShare}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Share with Teams</span>
          </button>
        </div>

        {/* Create New Plan Version Link */}
        <div className="rn-new-version-wrap">
          <button
            type="button"
            className="rn-btn-new-version"
            onClick={onNewVersion}
          >
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
