"use client";

import { useState } from "react";
import { PlanRunView, RapidBlockFormValues, RapidBlockImpactView } from "@/types";
import { EmergencyIncidentForm } from "@/components/rapid-block/EmergencyIncidentForm";
import { RapidBlockMap } from "@/components/rapid-block/RapidBlockMap";
import { CascadeImpactPanel } from "@/components/rapid-block/CascadeImpactPanel";
import { LiveTrainLookup } from "@/components/rapid-block/LiveTrainLookup";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { approveRunAdapter, submitRapidBlockAdapter } from "@/lib/adapters/planning-adapter";
import { CURRENT_REVIEWER, errorMessage } from "@/lib/utils";

interface RapidBlockViewProps {
  plan: PlanRunView;
  onExitToHome: () => void;
  onShowToast: (type: "success" | "warning" | "error" | "info", title: string, message?: string) => void;
  /** Adopts the approved emergency child run as the new active plan. */
  onRapidBlockApproved: (newPlan: PlanRunView) => void;
}

export function RapidBlockView({ plan, onExitToHome, onShowToast, onRapidBlockApproved }: RapidBlockViewProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [impact, setImpact] = useState<RapidBlockImpactView | null>(null);
  const [selectedSection, setSelectedSection] = useState(plan.sections[0]?.section_id ?? "");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [approvedPlan, setApprovedPlan] = useState<PlanRunView | null>(null);

  const handleInjectAndSolve = async (form: RapidBlockFormValues) => {
    setIsBusy(true);
    setSelectedSection(form.sectionId);
    try {
      const result = await submitRapidBlockAdapter(form, plan);
      setImpact(result);
      if (result.isCandidateReady) {
        onShowToast("success", "Emergency Candidate Computed", "Blast radius and cascade schedule calculated by the real solver.");
      } else {
        onShowToast("warning", "No Feasible Schedule Found", result.reasonCodes.join(", ") || "The optimizer could not fit this job.");
      }
    } catch (err) {
      onShowToast("error", "RapidBlock Request Rejected", errorMessage(err) || "Could not inject emergency block.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleApproveDispatch = async () => {
    if (!impact?.childRunId) return;
    setIsBusy(true);
    try {
      const approved = await approveRunAdapter(
        impact.childRunId,
        CURRENT_REVIEWER,
        `Rapid-block review: ${impact.incidentLocation.incidentType}`,
      );
      setApprovedPlan(approved);
      setIsSuccessModalOpen(true);
    } catch (err) {
      onShowToast("error", "Approval Failed", errorMessage(err) || "Emergency approval failed. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rapid-block-view-layout">
      {/* Top Banner - emergency mode, no wizard stepper (per spec) */}
      <div className="rapid-top-banner">
        <div className="banner-left">
          <span className="emergency-alert-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <div className="banner-text">
            <strong>Rapid-Block Review Mode</strong>
            <p>
              Current target → <code>{plan.snapshot_id}</code>
              <span className="banner-sep">·</span>
              This path skips the main wizard and recalculates the active plan after the incident is submitted.
            </p>
          </div>
        </div>

        <button type="button" className="btn-exit-banner" onClick={onExitToHome} disabled={isBusy}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Exit to Home
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="rapid-block-grid">
        {/* Left Column: Defect / Incident Form */}
        <div className="rapid-left-col">
          <EmergencyIncidentForm
            sections={plan.sections}
            isBusy={isBusy}
            onSubmit={handleInjectAndSolve}
            onExit={onExitToHome}
          />

          <LiveTrainLookup />
        </div>

        {/* Right Column: Dynamic Map + Cascade Impact */}
        <div className="rapid-right-col">
          <RapidBlockMap impact={impact} selectedSectionId={selectedSection} sections={plan.sections} />

          <CascadeImpactPanel
            impact={impact}
            isBusy={isBusy}
            onApproveRecommendation={handleApproveDispatch}
          />
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmModal
        isOpen={isSuccessModalOpen}
        title="Candidate Recommendation Approved"
        description={`The revised recommendation (${approvedPlan?.snapshot_id ?? ""}) has been created and approved.`}
        confirmLabel="Return to Home Dashboard"
        cancelLabel="Stay in Rapid-Block View"
        variant="default"
        onConfirm={() => {
          setIsSuccessModalOpen(false);
          if (approvedPlan) onRapidBlockApproved(approvedPlan);
          onExitToHome();
        }}
        onCancel={() => setIsSuccessModalOpen(false)}
      >
        <div className="emergency-success-summary">
          <div className="success-check-badge"><i className="fi fi-ss-check-circle"></i></div>
          <p>
            Incident registered on <strong>{impact?.incidentLocation.sectionId ?? selectedSection}</strong>.{" "}
            {impact?.rescheduledJobs.length ?? 0} downstream job(s) rescheduled,{" "}
            {impact?.preservedLockedJobs.length ?? 0} locked job(s) preserved.
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
}
