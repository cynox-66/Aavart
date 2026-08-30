"use client";

import { AppView } from "@/types";
import { WorkflowStepper } from "@/components/navigation/WorkflowStepper";

interface AppHeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  planId?: string;
  isPlanCreated?: boolean;
  isApproved?: boolean;
}

export function AppHeader({
  currentView,
  onNavigate,
  isPlanCreated = false,
  isApproved = false,
}: AppHeaderProps) {
  const isEmergency = currentView === "rapid-block";
  const isWizard =
    currentView === "wizard-step-1" ||
    currentView === "wizard-step-2" ||
    currentView === "wizard-step-3" ||
    currentView === "wizard-step-4" ||
    currentView === "wizard-step-5" ||
    currentView === "plan-approved";

  return (
    <header className="rn-header">
      {/* 1. Brand / Logo */}
      <div className="rn-brand-block">
        <button
          type="button"
          className="rn-brand-btn"
          onClick={() => onNavigate("home")}
          title="Go to RailNiyojan Home"
        >
          <div className="rn-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F2850" strokeWidth="2">
              {/* Locomotive engine icon */}
              <rect x="4" y="3" width="16" height="14" rx="3" />
              <path d="M4 11h16" />
              <circle cx="8" cy="7" r="1.5" fill="#0F2850" />
              <circle cx="16" cy="7" r="1.5" fill="#0F2850" />
              <path d="M6 17l-2 4" />
              <path d="M18 17l2 4" />
              <path d="M4 21h16" />
            </svg>
          </div>
          <div className="rn-brand-titles">
            <span className="rn-brand-title">RailNiyojan</span>
            <span className="rn-brand-subtitle">Integrated Block Planning</span>
          </div>
        </button>
      </div>

      {/* 2. Center: Workflow Stepper (Wizard) or Quick Navigation */}
      <div className="rn-header-center">
        {isWizard ? (
          <WorkflowStepper
            currentView={currentView}
            onNavigate={onNavigate}
            isPlanCreated={isPlanCreated}
            isApproved={isApproved}
          />
        ) : isEmergency ? (
          <div className="rn-emergency-badge">
            <span className="rn-pulse-red" />
            <strong>RAPID BLOCK EMERGENCY DESK</strong>
          </div>
        ) : (
          <div className="rn-home-accent-bar" />
        )}
      </div>

      {/* 3. Right: Date, Time, User Profile */}
      <div className="rn-header-meta">
        <div className="rn-datetime-group">
          <div className="rn-date-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>26 Aug 2026</span>
          </div>

          <div className="rn-time-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>10:42 AM</span>
          </div>
        </div>

        <div className="rn-user-pill">
          <div className="rn-user-avatar">AR</div>
          <div className="rn-user-text">
            <span className="rn-user-role">Divisional Manager</span>
            <span className="rn-user-div">WR - Vadodara</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
