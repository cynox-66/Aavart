"use client";

import { useState } from "react";
import { RapidBlockFormValues, RapidBlockImpactView } from "@/types";
import { EmergencyIncidentForm } from "@/components/rapid-block/EmergencyIncidentForm";
import { RapidBlockMap } from "@/components/rapid-block/RapidBlockMap";
import { CascadeImpactPanel } from "@/components/rapid-block/CascadeImpactPanel";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { submitRapidBlockAdapter } from "@/lib/adapters/planning-adapter";

interface RapidBlockViewProps {
  baseRunId: string;
  onExitToHome: () => void;
  onShowToast: (type: "success" | "warning" | "error" | "info", title: string, message?: string) => void;
}

export function RapidBlockView({ baseRunId, onExitToHome, onShowToast }: RapidBlockViewProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [impact, setImpact] = useState<RapidBlockImpactView | null>(null);
  const [selectedSection, setSelectedSection] = useState("ST-03");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleInjectAndSolve = async (form: RapidBlockFormValues) => {
    setIsBusy(true);
    setSelectedSection(form.sectionId);
    try {
      // Simulate/call rapidblock adapter
      const result = await submitRapidBlockAdapter(form, baseRunId);
      setImpact(result);
      onShowToast("success", "Emergency Candidate Computed", "Blast radius and cascade schedule calculated.");
    } catch (err: any) {
      onShowToast("error", "RapidBlock Calculation Failed", err?.message || "Could not inject emergency block.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleApproveDispatch = async () => {
    setIsBusy(true);
    try {
      // Simulate dispatch delay
      await new Promise((r) => setTimeout(r, 600));
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      onShowToast("error", "Dispatch Failed", err?.message || "Emergency authorization error.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rapid-block-view-layout">
      {/* Top Banner Notice */}
      <div className="rapid-top-banner">
        <div className="banner-left">
          <span className="emergency-alert-icon">🚨</span>
          <div>
            <strong>Emergency Rapid-Block Operations Desk</strong>
            <p>
              Direct live intervention mode. Injected blocks bypass standard wizard flow and dynamically
              reschedule conflicting corridor possessions.
            </p>
          </div>
        </div>

        <button type="button" className="btn-exit-banner" onClick={onExitToHome} disabled={isBusy}>
          ← Exit to Overview
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="rapid-block-grid">
        {/* Left Column: Defect / Incident Form */}
        <div className="rapid-left-col">
          <EmergencyIncidentForm
            isBusy={isBusy}
            onSubmit={handleInjectAndSolve}
            onExit={onExitToHome}
          />
        </div>

        {/* Right Column: Dynamic Map + Cascade Impact */}
        <div className="rapid-right-col">
          <RapidBlockMap impact={impact} selectedSectionId={selectedSection} />

          <CascadeImpactPanel
            impact={impact}
            isBusy={isBusy}
            onApproveDispatch={handleApproveDispatch}
          />
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmModal
        isOpen={isSuccessModalOpen}
        title="Emergency Dispatch Orders Disseminated!"
        description="Candidate plan SNAP-014-EMG has been sealed and transmitted to Western Railway Operating Control. Crew movements and speed restrictions are now active."
        confirmLabel="Return to Operations Desk"
        cancelLabel="Stay in Emergency View"
        variant="default"
        onConfirm={() => {
          setIsSuccessModalOpen(false);
          onExitToHome();
        }}
        onCancel={() => setIsSuccessModalOpen(false)}
      >
        <div className="emergency-success-summary">
          <div className="success-check-badge">✓</div>
          <p>
            Emergency Track Block registered on <strong>ST-03 (Km 512/4)</strong>. 3 downstream tasks
            shifted automatically.
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
}
