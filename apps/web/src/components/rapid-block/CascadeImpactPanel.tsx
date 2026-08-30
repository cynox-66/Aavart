"use client";

import { useState } from "react";
import { RapidBlockImpactView } from "@/types";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { mapReasonCodeToLabel } from "@/lib/utils";

interface CascadeImpactPanelProps {
  impact: RapidBlockImpactView | null;
  isBusy: boolean;
  onApproveRecommendation: () => Promise<void>;
}

export function CascadeImpactPanel({
  impact,
  isBusy,
  onApproveRecommendation,
}: CascadeImpactPanelProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Idle: nothing submitted yet.
  if (!impact) {
    return (
      <div className="cascade-impact-card empty">
        <span className="emergency-kicker">3. Cascade Impact</span>
        <h3>Awaiting Incident Submission</h3>
        <p>
          Submit the incident form to let the CP-SAT optimizer compute which scheduled work must
          move around this incident.
        </p>
      </div>
    );
  }

  // Solver could not fit the emergency job.
  if (!impact.isCandidateReady) {
    return (
      <div className="cascade-impact-card no-candidate">
        <span className="emergency-kicker">3. Cascade Impact</span>
        <h3>No Feasible Schedule Found</h3>
        <p>The optimizer could not fit this incident into the plan. Reason:</p>
        <ul className="cascade-reason-list">
          {impact.reasonCodes.map((code) => (
            <li key={code}>{mapReasonCodeToLabel(code).label}</li>
          ))}
        </ul>
        <p className="cascade-empty-note">
          Adjust the section or duration on the left and submit again.
        </p>
      </div>
    );
  }

  const rescheduledCount = impact.rescheduledJobs.length;
  const preservedCount = impact.preservedLockedJobs.length;

  return (
    <div className="cascade-impact-card">
      <div className="cascade-top-header">
        <span className="emergency-kicker">3. Cascade Impact (If Submitted)</span>
        <div className="candidate-status-tag">
          <span className="bullet-green" aria-hidden="true" /> Candidate ready
        </div>
      </div>

      {/* Impact stat cards */}
      <div className="cascade-stats-grid">
        <div className="cascade-stat-box warning">
          <span className="cascade-num warn">{rescheduledCount}</span>
          <span className="cascade-label">
            Scheduled maintenance job{rescheduledCount === 1 ? "" : "s"}
            <small>will be rescheduled</small>
          </span>
        </div>

        <div className="cascade-stat-box good">
          <span className="cascade-num good">{preservedCount}</span>
          <span className="cascade-label">
            Locked job{preservedCount === 1 ? "" : "s"}
            <small>will be preserved</small>
          </span>
        </div>
      </div>

      {/* Rescheduled job list */}
      {rescheduledCount > 0 && (
        <div className="impact-sub-section">
          <h4 className="sub-section-title">Rescheduled maintenance jobs</h4>
          <div className="affected-items-list">
            {impact.rescheduledJobs.map((job) => (
              <div key={job.jobId} className="affected-job-row">
                <div className="job-id-dept">
                  <span className={`dept-pill-sm ${job.department.toLowerCase()}`}>{job.department}</span>
                  <strong>{job.jobId}</strong>
                  <small className="sec-txt">{job.sectionId}</small>
                </div>
                <div className="shift-badge">
                  <span className="prev-time">{job.previousWindow}</span>
                  <span className="arrow-shift" aria-hidden="true">→</span>
                  <strong className="new-time">{job.newWindow}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rescheduledCount === 0 && (
        <p className="cascade-empty-note">
          No other jobs needed to move — the emergency block fits without displacing existing work.
        </p>
      )}

      {/* What happens next */}
      <div className="emergency-review-action-bar">
        <div className="review-notice">
          <span className="notice-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <div>
            <strong>What happens next?</strong>
            <p>
              Approving creates the revised recommendation and makes candidate run{" "}
              <code>{impact.childRunId}</code> the active plan. Affected tasks are rescheduled
              automatically. It does not grant a block, issue railway authority, or move any
              train — the recommendation still has to be actioned through the normal
              operational channel.
            </p>
          </div>
        </div>

        <div className="review-cta-group">
          <button
            type="button"
            className="btn-approve-emergency-recommendation"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={isBusy}
          >
            {isBusy ? (
              <><span className="spinner-inline" aria-hidden="true" /> Approving…</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Approve Candidate Recommendation
              </>
            )}
          </button>
          {/* Say what approval actually does. "Requires standard review before it
              becomes the active plan" contradicted the paragraph above, which
              correctly states that approving makes it active straight away. */}
          <span className="review-cta-hint">
            Becomes the active plan immediately — decision support only, the block still needs
            operational sanction.
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Approve candidate recommendation?"
        description={`This approves candidate run ${impact.childRunId} and reschedules ${rescheduledCount} maintenance task(s). It updates the active plan, confers no railway authority, and cannot be undone from this screen.`}
        confirmLabel="Confirm Approval"
        cancelLabel="Abort"
        variant="emergency"
        isBusy={isBusy}
        onConfirm={async () => {
          setIsConfirmModalOpen(false);
          await onApproveRecommendation();
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
}
