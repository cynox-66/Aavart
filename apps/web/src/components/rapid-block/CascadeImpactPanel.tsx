"use client";

import { useState } from "react";
import { RapidBlockImpactView } from "@/types";
import { ConfirmModal } from "@/components/layout/ConfirmModal";

interface CascadeImpactPanelProps {
  impact: RapidBlockImpactView | null;
  isBusy: boolean;
  onApproveDispatch: () => Promise<void>;
}

export function CascadeImpactPanel({
  impact,
  isBusy,
  onApproveDispatch,
}: CascadeImpactPanelProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  if (!impact) {
    return (
      <div className="cascade-impact-card empty">
        <span className="mono-kicker">CASCADE IMPACT SIMULATION</span>
        <h3>Awaiting Incident Submission</h3>
        <p>
          Submit the emergency defect form on the left to let the optimizer compute downstream job
          rescheduling and train headway delays.
        </p>
      </div>
    );
  }

  const rescheduledCount = impact.rescheduledJobs.length;
  const delayedTrainCount = impact.delayedTrains.length;
  const preservedCount = impact.preservedLockedJobs.length;

  return (
    <div className="cascade-impact-card">
      <div className="cascade-top-header">
        <div>
          <span className="emergency-kicker">CASCADE IMPACT ANALYSIS</span>
          <h3>Downstream Schedule Adjustments</h3>
        </div>

        <div className="candidate-status-tag">
          <span className="bullet-green" /> CANDIDATE SCHEDULE READY
        </div>
      </div>

      {/* 3 Impact Stat Boxes */}
      <div className="cascade-stats-grid">
        <div className="cascade-stat-box warning">
          <span className="cascade-num warn">{rescheduledCount}</span>
          <span className="cascade-label">Maintenance Tasks Rescheduled</span>
        </div>

        <div className="cascade-stat-box danger">
          <span className="cascade-num bad">{delayedTrainCount}</span>
          <span className="cascade-label">Passenger Trains Delayed</span>
        </div>

        <div className="cascade-stat-box good">
          <span className="cascade-num good">{preservedCount}</span>
          <span className="cascade-label">Locked Jobs Preserved</span>
        </div>
      </div>

      {/* Affected Maintenance Tasks List */}
      <div className="impact-sub-section">
        <h4 className="sub-section-title">Rescheduled Maintenance Jobs</h4>
        <div className="affected-items-list">
          {impact.rescheduledJobs.map((job) => (
            <div key={job.jobId} className="affected-job-row">
              <div className="job-id-dept">
                <span className={`dept-pill-sm ${job.department.toLowerCase()}`}>
                  {job.department}
                </span>
                <strong>{job.jobId}</strong>
                <small className="sec-txt">Section {job.sectionId}</small>
              </div>

              <div className="shift-badge">
                <span className="prev-time">{job.previousWindow}</span>
                <span className="arrow-shift">→</span>
                <strong className="new-time">{job.newWindow}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affected Commercial Trains List */}
      <div className="impact-sub-section">
        <h4 className="sub-section-title">Anticipated Passenger Train Delays</h4>
        <div className="affected-trains-list">
          {impact.delayedTrains.map((train) => (
            <div key={train.trainId} className="affected-train-row">
              <div className="train-meta">
                <span className="train-id-badge">{train.trainId}</span>
                <strong>{train.trainName}</strong>
                <small>{train.affectedSection}</small>
              </div>

              <div className="delay-badge">
                <span className="delay-min">+{train.delayMinutes} min delay</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatch Action Bar */}
      <div className="emergency-dispatch-action-bar">
        <div className="dispatch-notice">
          <span className="notice-icon">⚡</span>
          <p>
            Approving dispatch creates candidate version <strong>SNAP-014-EMG</strong> and broadcasts
            track possession orders to Western Railway controllers.
          </p>
        </div>

        <button
          type="button"
          className="btn-approve-emergency-dispatch"
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={isBusy}
        >
          {isBusy ? "Dispatching Orders..." : "⚡ Approve Emergency Dispatch"}
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Authorize Emergency Block Dispatch?"
        description={`You are about to sanction an emergency possession block on Section ST-03 (AKW–BHU). This will shift ${rescheduledCount} scheduled maintenance tasks and delay ${delayedTrainCount} commercial train services.`}
        confirmLabel="Confirm & Authorize Dispatch"
        cancelLabel="Abort"
        variant="emergency"
        isBusy={isBusy}
        onConfirm={async () => {
          setIsConfirmModalOpen(false);
          await onApproveDispatch();
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
}
