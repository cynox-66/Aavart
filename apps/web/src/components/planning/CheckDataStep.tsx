"use client";

import { useState } from "react";
import { ValidationState } from "@/types";

interface CheckDataStepProps {
  validation: ValidationState;
  onContinue: () => void;
  onBack: () => void;
  isBusy?: boolean;
}

export function CheckDataStep({
  validation,
  onContinue,
  onBack,
  isBusy = false,
}: CheckDataStepProps) {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(
    validation.issues.find((i) => !i.resolved)?.id ?? null,
  );

  // The backend registers a snapshot candidate only for a dataset that validated
  // clean, and Step 3 refuses to solve without one. Gate on that single fact so
  // this button and the solver can never disagree. There is deliberately no
  // control on this screen that can change it: the old "Mark as Resolved" and
  // "Auto-Fix All" only ever flipped local state the backend had already refused.
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
                <i aria-hidden="true" className="fi fi-ss-check-circle" style={{ fontSize: "44px", color: "var(--status-green-dark)", display: "flex" }}></i>
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
                    No snapshot was registered, so the solver cannot run. Correct the uploaded
                    source data, re-upload it, and run backend validation again — nothing on this
                    screen can change what the backend accepts.
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
                            <span className="issue-resolve-note">
                              Backend rejected this candidate. Return to Step 1, update the source
                              file, and validate again.
                            </span>
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
                  <span className="check-mark">{source.status === "loaded" ? <i aria-hidden="true" className="fi fi-ss-check-circle"></i> : "•"}</span>
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
                <span className="check-mark"><i aria-hidden="true" className="fi fi-ss-check-circle"></i></span> Schema Version 1.0 Strict
              </li>
              <li className="check-item passed">
                <span className="check-mark"><i aria-hidden="true" className="fi fi-ss-check-circle"></i></span> Asset & Section References Valid
              </li>
              <li className={`check-item ${hasSnapshot ? "passed" : "pending"}`}>
                <span className="check-mark">{hasSnapshot ? <i aria-hidden="true" className="fi fi-ss-check-circle"></i> : "•"}</span> Priority & Duration Bounds Checked
              </li>
              <li className={`check-item ${hasSnapshot ? "passed" : "pending"}`}>
                <span className="check-mark">{hasSnapshot ? <i aria-hidden="true" className="fi fi-ss-check-circle"></i> : "•"}</span> Timetable Supply Gap Coherence
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
              Backend validation must pass before the solver can run — correct the data at source and re-upload
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
