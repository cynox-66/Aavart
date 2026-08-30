"use client";

import { useState } from "react";
import { JobDetailView } from "@/types";
import { ConfirmModal } from "@/components/layout/ConfirmModal";

interface JobActionsProps {
  job: JobDetailView;
  isApproved: boolean;
  isBusy: boolean;
  onLockJob: (jobId: string) => Promise<void>;
  onChangeWindow: (jobId: string, newWindowId: string) => void;
  onExcludeJob: (jobId: string) => void;
}

export function JobActions({
  job,
  isApproved,
  isBusy,
  onLockJob,
  onChangeWindow,
  onExcludeJob,
}: JobActionsProps) {
  const [isWindowModalOpen, setIsWindowModalOpen] = useState(false);
  const [windowInput, setWindowInput] = useState("");

  const openWindowModal = () => {
    setWindowInput(job.scheduled_window_id ?? "");
    setIsWindowModalOpen(true);
  };

  const confirmWindowChange = () => {
    if (windowInput.trim()) {
      onChangeWindow(job.job_id, windowInput.trim());
    }
    setIsWindowModalOpen(false);
  };

  return (
    <div className="rn-job-actions-block">
      <h3 className="rn-sidebar-section-heading">ACTIONS</h3>

      <div className="rn-job-actions-grid">
        {/* Action 1: Lock in Schedule */}
        <button
          type="button"
          className={`rn-action-btn ${job.locked ? "active-locked" : ""}`}
          onClick={() => onLockJob(job.job_id)}
          disabled={isApproved || isBusy}
          title="Lock this job at current slot"
        >
          <div className="rn-btn-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="rn-btn-text-wrap">
            <strong className="rn-btn-title">Lock in Schedule</strong>
            <span className="rn-btn-sub">Keep this job as is</span>
          </div>
        </button>

        {/* Action 2: Change Window - manual entry (there's no backend data
            source to auto-suggest an alternative window from) */}
        <button
          type="button"
          className="rn-action-btn"
          onClick={openWindowModal}
          disabled={isApproved || isBusy}
          title="Manually move this job to another window"
        >
          <div className="rn-btn-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="rn-btn-text-wrap">
            <strong className="rn-btn-title">Change Window</strong>
            <span className="rn-btn-sub">Enter a target window ID</span>
          </div>
        </button>

        {/* Action 3: Exclude from Plan */}
        <button
          type="button"
          className="rn-action-btn"
          onClick={() => onExcludeJob(job.job_id)}
          disabled={isApproved || isBusy}
          title="Remove this task from active schedule"
        >
          <div className="rn-btn-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="rn-btn-text-wrap">
            <strong className="rn-btn-title">Exclude from Plan</strong>
            <span className="rn-btn-sub">Remove this job</span>
          </div>
        </button>
      </div>

      <ConfirmModal
        isOpen={isWindowModalOpen}
        title={`Change window for ${job.job_id}`}
        description="Enter the target window ID to move this job to. There is no automatic suggestion - the backend does not expose a list of alternative windows, so this must be entered manually."
        confirmLabel="Move Job"
        onConfirm={confirmWindowChange}
        onCancel={() => setIsWindowModalOpen(false)}
      >
        <input
          type="text"
          className="rn-window-id-input"
          value={windowInput}
          onChange={(e) => setWindowInput(e.target.value)}
          placeholder="e.g. WIN-002"
          autoFocus
        />
      </ConfirmModal>
    </div>
  );
}
