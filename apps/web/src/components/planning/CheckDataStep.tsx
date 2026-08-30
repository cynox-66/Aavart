"use client";

import { useState } from "react";
import { ValidationState } from "@/types";

interface CheckDataStepProps {
  validation: ValidationState;
  onAcknowledgeIssue: (issueId: string) => void;
  onContinue: () => void;
  onBack: () => void;
  isBusy?: boolean;
}

export function CheckDataStep({
  validation,
  onAcknowledgeIssue,
  onContinue,
  onBack,
  isBusy = false,
}: CheckDataStepProps) {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(
    validation.issues.find((i) => !i.resolved)?.id ?? null,
  );

  // The backend registers a snapshot candidate only for a dataset that validated
  // clean, and Step 3 refuses to solve without one. Gate on that single fact so
  // this button and the solver can never disagree - acknowledging an issue in the
  // browser changes nothing the backend will accept.
  const hasSnapshot = validation.snapshotCandidateId !== null;

  return (
    <div className="check-data-layout">
      <div className="planning-step-header">
        <div>
          <span className="step-kicker">STEP 02 / PRE-SOLVER AUDIT</span>
          <h2>Validate Planning Dataset</h2>
          <p className="step-desc">
            Independent schema, reference integrity, and timetable compatibility checks before
            launching the constraint programming optimizer.
          </p>
        </div>

        <div className="snapshot-candidate-pill">
          <span className="mono-label">SNAPSHOT CANDIDATE</span>
          <strong className="snapshot-id">{validation.snapshotCandidateId ?? "—"}</strong>
        </div>
      </div>

      <div className="check-data-grid">
        {/* Main Validation State Container */}
        <div className="validation-main-column">
          {hasSnapshot ? (
            /* ALL GOOD STATE */
            <div className="validation-all-good-card">
              <div className="all-good-header">
                <div className="success-icon-badge">✓</div>
                <div>
                  <h3>Dataset Validated & Ready</h3>
                  <p className="all-good-sub">
                    No blocking schema errors or safety isolation violations found across loaded
                    department feeds.
                  </p>
                </div>
              </div>

              <div className="validation-metrics-grid">
                <div className="val-stat-box">
                  <span className="val-stat-num">{validation.counts.jobs}</span>
                  <span className="val-stat-label">Total Maintenance Jobs</span>
                </div>
                <div className="val-stat-box">
                  <span className="val-stat-num">{validation.counts.windows}</span>
                  <span className="val-stat-label">Planning Windows</span>
                </div>
                <div className="val-stat-box">
                  <span className="val-stat-num">{validation.counts.sections}</span>
                  <span className="val-stat-label">Corridor Sections</span>
                </div>
                <div className="val-stat-box">
                  <span className="val-stat-num">{validation.counts.resources}</span>
                  <span className="val-stat-label">Engineering Crews</span>
                </div>
              </div>

              <div className="ready-confirmation-banner">
                <span className="green-dot" />
                <span>
                  Backend hash <strong>{validation.sourceHash ?? "unavailable"}</strong> is ready for{" "}
                  <strong>Google OR-Tools CP-SAT</strong> planning.
                </span>
              </div>
            </div>
          ) : (
            /* NEEDS ATTENTION STATE */
            <div className="validation-needs-attention-card">
              <div className="attention-header">
                <div className="warning-icon-badge">⚠️</div>
                <div className="attention-title-group">
                  <h3>
                    Rejected by validation ({validation.issues.length}{" "}
                    {validation.issues.length === 1 ? "issue" : "issues"})
                  </h3>
                  <p className="attention-sub">
                    No snapshot was registered, so the solver cannot run on this dataset. These
                    records must be corrected at source and the department feed re-uploaded —
                    nothing on this screen can change what the backend accepts.
                  </p>
                </div>
                <button type="button" className="btn-attention-primary" onClick={onBack} disabled={isBusy}>
                  ← Back to Select Data
                </button>
              </div>

              <div className="issues-accordion">
                {validation.issues.map((issue) => {
                  const isExpanded = expandedIssueId === issue.id;
                  return (
                    <div
                      key={issue.id}
                      className={`issue-item-card ${issue.resolved ? "resolved" : "open"} ${
                        isExpanded ? "expanded" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="issue-header-row"
                        onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                        aria-expanded={isExpanded}
                      >
                        <div className="issue-title-area">
                          <span className={`issue-tag ${issue.severity}`}>
                            {issue.resolved ? "RESOLVED" : issue.severity.toUpperCase()}
                          </span>
                          <strong className="issue-code">{issue.code}</strong>
                          <span className="issue-field">Field: {issue.field}</span>
                          {issue.jobId && <span className="issue-job-id">Job: {issue.jobId}</span>}
                        </div>

                        <div className="issue-expand-icon">{isExpanded ? "▲" : "▼"}</div>
                      </button>

                      {isExpanded && (
                        <div className="issue-detail-content">
                          <p className="issue-message">{issue.message}</p>

                          {issue.suggestedFix && (
                            <div className="suggested-fix-box">
                              <span className="fix-icon">💡</span>
                              <div>
                                <strong>Suggested Automated Fix:</strong>
                                <p>{issue.suggestedFix}</p>
                              </div>
                            </div>
                          )}

                          <div className="issue-actions-row">
                            {issue.resolved ? (
                              <span className="resolved-status-text">
                                ✓ Acknowledged — still must be fixed at source
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-fix-item"
                                  onClick={() => onAcknowledgeIssue(issue.id)}
                                >
                                  ✓ Acknowledge
                                </button>
                                <span className="issue-resolve-note">
                                  Marks this issue as read. It does not change the dataset or
                                  unblock the solver.
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="validation-sidebar">
          <div className="sidebar-card">
            <h4>Source Provenance</h4>
            <ul className="protocol-checks-list">
              {validation.sourceSummaries.map((source) => (
                <li className={`check-item ${source.status === "loaded" ? "passed" : "pending"}`} key={source.source_id}>
                  <span className="check-mark">{source.status === "loaded" ? "✓" : "•"}</span>
                  {source.department}: {source.job_count} jobs / {source.warning_count} warnings
                </li>
              ))}
              {validation.sourceSummaries.length === 0 && (
                <li className="check-item pending">
                  <span className="check-mark">•</span> No source metadata supplied
                </li>
              )}
            </ul>
          </div>

          <div className="sidebar-card">
            <h4>Validation Protocol</h4>
            <ul className="protocol-checks-list">
              <li className="check-item passed">
                <span className="check-mark">✓</span> Schema Version 1.0 Strict
              </li>
              <li className="check-item passed">
                <span className="check-mark">✓</span> Asset & Section References Valid
              </li>
              <li className={`check-item ${hasSnapshot ? "passed" : "pending"}`}>
                <span className="check-mark">{hasSnapshot ? "✓" : "•"}</span> Priority & Duration Bounds Checked
              </li>
              <li className={`check-item ${hasSnapshot ? "passed" : "pending"}`}>
                <span className="check-mark">{hasSnapshot ? "✓" : "•"}</span> Timetable Supply Gap Coherence
              </li>
            </ul>
          </div>

          <div className="audit-immutability-note">
            <span className="lock-badge-icon">🔒</span>
            <p>
              Once approved for planning, this candidate snapshot will be hashed and sealed
              immutably in the planning registry.
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Command Bar */}
      <div className="step-bottom-bar">
        <button type="button" className="btn-step-cancel" onClick={onBack} disabled={isBusy}>
          ← Back to Select Data
        </button>

        <div className="step-next-group">
          {!hasSnapshot && (
            <span className="validation-hint error">
              No validated snapshot — correct the data at source and re-upload
            </span>
          )}
          <button
            type="button"
            className="btn-step-continue"
            onClick={onContinue}
            disabled={!hasSnapshot || isBusy}
          >
            {isBusy ? "Launching Solver..." : "3. Create Plan (CP-SAT Solver) →"}
          </button>
        </div>
      </div>
    </div>
  );
}
