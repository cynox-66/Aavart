"use client";

import { CorridorPresetId, DepartmentDataSource, PlanningHorizon } from "@/types";
import { CORRIDOR_PRESETS, getPreset } from "@/lib/corridor-presets";

interface SelectDataStepProps {
  sources: DepartmentDataSource[];
  horizon: PlanningHorizon;
  onHorizonChange: (horizon: PlanningHorizon) => void;
  onToggleSourceStatus: (id: string) => void;
  onReplaceFile: (id: string, file: File) => Promise<void>;
  onContinue: () => void;
  onCancel: () => void;
  isBusy?: boolean;
  /** Corridor whose dataset seeds the department cards. */
  selectedCorridorId: CorridorPresetId;
  onSelectCorridor: (id: CorridorPresetId) => void;
  /** Only relevant when selectedCorridorId === "custom". */
  customBaseDataset: Record<string, unknown> | null;
  onUploadCustomBase: (file: File) => Promise<void>;
}

export function SelectDataStep({
  sources,
  horizon,
  onHorizonChange,
  onToggleSourceStatus,
  onReplaceFile,
  onContinue,
  onCancel,
  isBusy = false,
  selectedCorridorId,
  onSelectCorridor,
  customBaseDataset,
  onUploadCustomBase,
}: SelectDataStepProps) {
  const loadedCount = sources.filter((s) => s.status === "loaded").length;
  const totalTasks = sources
    .filter((s) => s.status === "loaded")
    .reduce((acc, s) => acc + s.taskCount, 0);

  const selectedPreset = getPreset(selectedCorridorId);
  const isCustom = selectedCorridorId === "custom";

  // The custom preset has no bundled dataset, so it cannot be validated until
  // the planner uploads a base file.
  const canContinue = loadedCount > 0 && !isBusy && (!isCustom || customBaseDataset !== null);

  const handleFileInput = (id: string, files: FileList | null) => {
    if (files && files[0]) {
      void onReplaceFile(id, files[0]);
    }
  };

  const handleCustomBaseFileInput = (files: FileList | null) => {
    if (files && files[0]) {
      void onUploadCustomBase(files[0]);
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
              onClick={() => onHorizonChange("WEEKLY")}
            >
              Weekly (Standard)
            </button>
            <button
              type="button"
              className={`toggle-btn ${horizon === "MONTHLY" ? "active" : ""}`}
              onClick={() => onHorizonChange("MONTHLY")}
            >
              Monthly (30-day filter)
            </button>
          </div>
          <p className="validation-hint">
            Monthly mode uses the same CP-SAT solver on a 30-day date-bounded snapshot. It does not create a separate monthly optimizer.
          </p>
        </div>
      </div>

      {/* Corridor Selector - picks the base dataset posted to /datasets/validate */}
      <div className="corridor-selector-section">
        <h3 className="corridor-selector-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Select Corridor
        </h3>
        <div className="corridor-selector-cards" role="radiogroup" aria-label="Corridor selection">
          {CORRIDOR_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedCorridorId;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`corridor-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectCorridor(preset.id)}
                disabled={isBusy}
              >
                {isSelected && (
                  <span className="corridor-card-check" aria-hidden="true">
                    <i aria-hidden="true" className="fi fi-ss-check-circle" style={{ fontSize: "14px", color: "currentColor", display: "flex" }}></i>
                  </span>
                )}
                <div className="corridor-card-label">{preset.label}</div>
                <div className="corridor-card-meta">
                  {preset.id !== "custom" ? (
                    <>
                      <span className="corridor-meta-pill">{preset.lineType}</span>
                      <span className="corridor-meta-pill">{preset.sectionCount} sec</span>
                      <span className="corridor-meta-pill">{preset.jobCount} jobs</span>
                    </>
                  ) : (
                    <span className="corridor-meta-pill upload-pill">Upload file</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom base upload zone - only shown for the "Custom" preset */}
        {isCustom && (
          <div className={`custom-base-upload-zone ${customBaseDataset ? "uploaded" : ""}`}>
            {customBaseDataset ? (
              <div className="custom-base-uploaded-state">
                <i aria-hidden="true" className="fi fi-ss-check-circle" style={{ fontSize: "16px", color: "currentColor", display: "flex" }}></i>
                <span>Base dataset loaded</span>
                <label className="custom-base-reupload-btn" title="Replace dataset">
                  Replace
                  <input
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    onChange={(e) => handleCustomBaseFileInput(e.target.files)}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            ) : (
              <label className="custom-base-drop-zone">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload base dataset (JSON or CSV)</span>
                <small>Upload a full <code>dataset.json</code> file - the planner will use it as the base for every department.</small>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={(e) => handleCustomBaseFileInput(e.target.files)}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>
        )}
      </div>

      <div className="select-data-grid">
        {/* Department Data Sources List */}
        <div className="data-sources-column">
          <h3 className="section-subhead">Department Input Channels</h3>

          <div className="source-cards-stack">
            {sources.map((source) => {
              const isLoaded = source.status === "loaded";
              const hasCustomFile = Boolean(source.customDataset);

              return (
                <div
                  key={source.id}
                  className={`dept-source-card ${isLoaded ? "loaded" : "skipped"}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    {source.id === "tms" && <i aria-hidden="true" className="fi fi-bs-train-track" style={{ fontSize: "32px", color: "#F59E0B", display: "flex" }}></i>}
                    {source.id === "smms" && <i aria-hidden="true" className="fi fi-br-traffic-light-stop" style={{ fontSize: "32px", color: "#3B82F6", display: "flex" }}></i>}
                    {source.id === "tdms" && <i aria-hidden="true" className="fi fi-bs-utility-pole-double" style={{ fontSize: "32px", color: "#10B981", display: "flex" }}></i>}
                    {source.id === "civil" && <i aria-hidden="true" className="fi fi-bs-hammer-brush" style={{ fontSize: "32px", color: "#A855F7", display: "flex" }}></i>}

                  <div className="source-main-info">
                    <div className="dept-badge-row">
                      <span className={`dept-badge ${source.department.toLowerCase()}`}>
                        {source.department}
                      </span>
                      <span className="source-format-tag">{source.sourceType}</span>
                      {hasCustomFile && <span className="custom-file-badge">Custom</span>}
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
                        <span className="metric-pill">
                          <strong>{source.rowCount ?? source.taskCount}</strong> Rows
                        </span>
                        {(source.warningCount ?? 0) > 0 && (
                          <span className="metric-pill warning">
                            <strong>{source.warningCount}</strong> Warnings
                          </span>
                        )}
                        <span className="update-stamp">Updated {source.updatedAt}</span>
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="source-actions">
                    {isLoaded ? (
                      <>
                        <label className="btn-upload-label" title="Upload new CSV/JSON file">
                          <span>{hasCustomFile ? "Replace File" : "Override"}</span>
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
                <dd>
                  {isCustom
                    ? customBaseDataset
                      ? "Custom dataset (uploaded)"
                      : "No dataset loaded"
                    : selectedPreset.label}
                </dd>
              </div>
              {!isCustom && (
                <>
                  <div>
                    <dt>Chainage</dt>
                    <dd>{selectedPreset.chainage}</dd>
                  </div>
                  <div>
                    <dt>Line Type</dt>
                    <dd>{selectedPreset.lineType}</dd>
                  </div>
                </>
              )}
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
                {isCustom && customBaseDataset === null
                  ? "⚠️ Upload a base dataset for the custom corridor to continue"
                  : "⚠️ Select at least one department dataset to continue"}
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
