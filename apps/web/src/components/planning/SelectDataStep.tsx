"use client";

import { useState } from "react";
import { DepartmentDataSource, PlanningHorizon } from "@/types";

interface SelectDataStepProps {
  sources: DepartmentDataSource[];
  onToggleSourceStatus: (id: string) => void;
  onReplaceFile: (id: string, fileName: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  isBusy?: boolean;
}

export function SelectDataStep({
  sources,
  onToggleSourceStatus,
  onReplaceFile,
  onContinue,
  onCancel,
  isBusy = false,
}: SelectDataStepProps) {
  const [horizon, setHorizon] = useState<PlanningHorizon>("WEEKLY");

  const loadedCount = sources.filter((s) => s.status === "loaded").length;
  const totalTasks = sources
    .filter((s) => s.status === "loaded")
    .reduce((acc, s) => acc + s.taskCount, 0);

  const canContinue = loadedCount > 0 && !isBusy;

  const handleFileInput = (id: string, files: FileList | null) => {
    if (files && files[0]) {
      onReplaceFile(id, files[0].name);
    }
  };

  return (
    <div className="select-data-layout">
      <div className="planning-step-header">
        <div>
          <span className="step-kicker">STEP 01 / INGESTION GATE</span>
          <h2>Select Maintenance Planning Data</h2>
          <p className="step-desc">
            Load or upload maintenance demands across railway engineering departments. The solver will
            integrate overlapping demands into single track possessions.
          </p>
        </div>

        <div className="horizon-switch-box">
          <label className="switch-label">Planning Horizon:</label>
          <div className="horizon-toggle-group">
            <button
              type="button"
              className={`toggle-btn ${horizon === "WEEKLY" ? "active" : ""}`}
              onClick={() => setHorizon("WEEKLY")}
            >
              Weekly (Standard)
            </button>
            <button
              type="button"
              className={`toggle-btn ${horizon === "MONTHLY" ? "active" : ""}`}
              onClick={() => setHorizon("MONTHLY")}
            >
              Monthly (Macro)
            </button>
          </div>
        </div>
      </div>

      <div className="select-data-grid">
        {/* Department Data Sources List */}
        <div className="data-sources-column">
          <h3 className="section-subhead">Department Input Channels</h3>

          <div className="source-cards-stack">
            {sources.map((source) => {
              const isLoaded = source.status === "loaded";

              return (
                <div
                  key={source.id}
                  className={`dept-source-card ${isLoaded ? "loaded" : "skipped"}`}
                >
                  <div className="source-main-info">
                    <div className="dept-badge-row">
                      <span className={`dept-badge ${source.department.toLowerCase()}`}>
                        {source.department}
                      </span>
                      <span className="source-format-tag">{source.sourceType}</span>
                    </div>

                    <h4 className="source-title">{source.name}</h4>
                    <p className="source-file">
                      {isLoaded ? (
                        <>
                          <span className="file-icon">📄</span> {source.fileName}
                        </>
                      ) : (
                        <span className="skipped-note">Excluded from this planning run</span>
                      )}
                    </p>

                    {isLoaded && (
                      <div className="source-metrics">
                        <span className="metric-pill">
                          <strong>{source.taskCount}</strong> Maintenance Tasks
                        </span>
                        <span className="update-stamp">Updated {source.updatedAt}</span>
                      </div>
                    )}
                  </div>

                  <div className="source-actions">
                    {isLoaded ? (
                      <>
                        <label className="btn-upload-label" title="Upload new CSV/JSON file">
                          <span>Replace File</span>
                          <input
                            type="file"
                            accept=".csv,.json,text/csv,application/json"
                            onChange={(e) => handleFileInput(source.id, e.target.files)}
                            style={{ display: "none" }}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-skip-source"
                          onClick={() => onToggleSourceStatus(source.id)}
                          title="Skip this department"
                        >
                          Skip
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-include-source"
                        onClick={() => onToggleSourceStatus(source.id)}
                      >
                        + Include Department
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info & Summary Sidebar */}
        <aside className="data-info-sidebar">
          <div className="info-card">
            <h4>Corridor Supply & Ruleset</h4>
            <dl className="info-kv-list">
              <div>
                <dt>Corridor</dt>
                <dd>WR • BRC to SUR (Km 0–256)</dd>
              </div>
              <div>
                <dt>Ruleset Version</dt>
                <dd>Demo Ruleset v1 (Strict Safety)</dd>
              </div>
              <div>
                <dt>Included Departments</dt>
                <dd>{loadedCount} of {sources.length}</dd>
              </div>
              <div>
                <dt>Total Maintenance Load</dt>
                <dd><strong>{totalTasks} Jobs</strong></dd>
              </div>
            </dl>
          </div>

          <div className="guidance-box">
            <span className="guide-icon">💡</span>
            <div className="guide-text">
              <strong>Joint Possession Tip</strong>
              <p>
                Including both Track (TMS) and Signal (SMMS) data allows the solver to co-locate switch
                overhauls and track inspections in the same window, reducing total section closure hours.
              </p>
            </div>
          </div>

          {/* Action Box placed directly below Joint Possession Tip */}
          <div className="sidebar-action-card">
            {!canContinue && (
              <div className="validation-hint">
                ⚠️ Select at least one department dataset to continue
              </div>
            )}
            <div className="sidebar-actions-row">
              <button
                type="button"
                className="btn-step-cancel"
                onClick={onCancel}
                disabled={isBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-step-continue"
                onClick={onContinue}
                disabled={!canContinue}
              >
                {isBusy ? "Validating..." : "Check Data →"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
