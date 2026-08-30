"use client";

import { useState } from "react";
import { PlanRunView } from "@/types";

interface ApprovePlanStepProps {
  plan: PlanRunView;
  onApprove: (reviewer: string, comment: string) => Promise<void>;
  onBack: () => void;
  onExport?: () => Promise<void>;
  isBusy?: boolean;
}

const days = [
  { day: "Mon", date: "18 Aug" },
  { day: "Tue", date: "19 Aug" },
  { day: "Wed", date: "20 Aug" },
  { day: "Thu", date: "21 Aug" },
  { day: "Fri", date: "22 Aug" },
  { day: "Sat", date: "23 Aug" },
  { day: "Sun", date: "24 Aug" },
];

export function ApprovePlanStep({
  plan,
  onApprove,
  onExport,
  isBusy = false,
}: ApprovePlanStepProps) {
  const [notes, setNotes] = useState("");

  const handleApproveClick = async () => {
    await onApprove("AR (Divisional Manager, WR - Vadodara)", notes);
  };

  return (
    <div className="rn-approve-workspace">
      {/* 1. Step Header */}
      <div className="planning-step-header">
        <div>
          <span className="step-kicker">STEP 05 / FINAL AUTHORIZATION</span>
          <h2>Review &amp; Approve Plan</h2>
          <p className="step-desc">
            Confirm the optimized schedule for <strong>{plan.snapshot_id || "SNAP-014"}</strong> meets
            safety and operational requirements. Once approved, it will be locked and published.
          </p>
        </div>
      </div>

      {/* 2. 4 KPI Metric Cards in a row */}
      <div className="rn-kpi-cards-row">
        {/* Card 1: Plan Quality */}
        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Plan Quality</span>
            <div className="rn-kpi-card-value green">OPTIMAL</div>
            <span className="rn-kpi-card-sub">Best balance of safety, efficiency and least disruption</span>
          </div>
        </div>

        {/* Card 2: Total Possessions */}
        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <line x1="6" y1="3" x2="6" y2="21" />
              <line x1="18" y1="3" x2="18" y2="21" />
              <line x1="6" y1="7" x2="18" y2="7" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Total Possessions</span>
            <div className="rn-kpi-card-value dark">
              1 <span className="rn-val-badge green">↓ 60%</span>
            </div>
            <span className="rn-kpi-card-sub">vs. Previous Plan (2)</span>
          </div>
        </div>

        {/* Card 3: Closure Time */}
        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Closure Time</span>
            <div className="rn-kpi-card-value green">-36%</div>
            <span className="rn-kpi-card-sub">vs. Previous Plan</span>
          </div>
        </div>

        {/* Card 4: Total Tasks */}
        <div className="rn-kpi-card">
          <div className="rn-kpi-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div className="rn-kpi-content">
            <span className="rn-kpi-card-label">Total Tasks</span>
            <div className="rn-kpi-card-value dark">26</div>
            <span className="rn-kpi-card-sub">Maintenance tasks</span>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Split */}
      <div className="rn-approve-main-grid">
        {/* Left Column: Corridor Overview, Key Details, Weekly Timeline Overview */}
        <div className="rn-approve-left-col">
          {/* Corridor Overview & Key Details Split */}
          <div className="rn-approve-top-row">
            {/* Corridor Schematic with Integrated Block bar */}
            <div className="rn-card rn-approve-corridor-card">
              <h2 className="rn-card-title">CORRIDOR OVERVIEW</h2>
              <div className="rn-approve-corridor-svg-wrap">
                <svg viewBox="0 0 420 100" className="rn-appr-corridor-svg">
                  {/* Track line */}
                  <line x1="30" y1="40" x2="390" y2="40" stroke="#1E293B" strokeWidth="3" />

                  {/* Stations */}
                  {[
                    { id: "BRC", x: 30 },
                    { id: "VDA", x: 120 },
                    { id: "AKW", x: 210 },
                    { id: "BHU", x: 300 },
                    { id: "SUR", x: 390 },
                  ].map((stn) => (
                    <g key={stn.id}>
                      <circle cx={stn.x} cy="40" r="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
                      <text x={stn.x} y="22" textAnchor="middle" className="rn-appr-stn-lbl">{stn.id}</text>
                    </g>
                  ))}

                  {/* Section labels */}
                  <text x="75" y="60" textAnchor="middle" className="rn-appr-sec-lbl">ST-01</text>
                  <text x="165" y="60" textAnchor="middle" className="rn-appr-sec-lbl">ST-02</text>
                  <text x="255" y="60" textAnchor="middle" className="rn-appr-sec-lbl">ST-03</text>
                  <text x="345" y="60" textAnchor="middle" className="rn-appr-sec-lbl">ST-04</text>

                  {/* Integrated Block Green Bar under ST-01 to ST-03 */}
                  <line x1="30" y1="80" x2="300" y2="80" stroke="#CBD5E1" strokeWidth="1" />
                  <rect x="120" y="72" width="180" height="18" rx="4" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1" />
                  {/* diagonal hatch pattern */}
                  <text x="210" y="85" textAnchor="middle" fill="#15803D" fontSize="10" fontWeight="600">
                    Integrated Block
                  </text>
                </svg>
              </div>
            </div>

            {/* Key Details Card */}
            <div className="rn-card rn-approve-details-card">
              <h2 className="rn-card-title">KEY DETAILS</h2>
              <div className="rn-key-details-list">
                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Departments Involved</span>
                  </div>
                  <strong className="rn-detail-val">3</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Total Manpower</span>
                  </div>
                  <strong className="rn-detail-val">148</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Total Machines</span>
                  </div>
                  <strong className="rn-detail-val">32</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Safety Constraints Applied</span>
                  </div>
                  <strong className="rn-detail-val">12</strong>
                </div>

                <div className="rn-detail-row">
                  <div className="rn-detail-key">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Planning Window</span>
                  </div>
                  <strong className="rn-detail-val">18 Aug – 24 Aug 2026</strong>
                </div>
              </div>

              <div className="rn-view-all-link-wrap">
                <button type="button" className="rn-btn-view-details">
                  <span>View All Details</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Timeline Overview */}
          <div className="rn-card rn-timeline-card">
            <div className="rn-card-header">
              <h2 className="rn-card-title">WEEKLY TIMELINE OVERVIEW (18 Aug – 24 Aug 2026)</h2>
              <button type="button" className="rn-btn-expand-timeline">
                <span>Expand Timeline</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>

            <div className="rn-gantt-table-wrap">
              <table className="rn-gantt-table">
                <thead>
                  <tr>
                    <th className="rn-th-section">Section</th>
                    {days.map((d) => (
                      <th key={d.day} className="rn-th-day">
                        <span className="rn-th-dayname">{d.day}</span>
                        <span className="rn-th-date">{d.date}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="rn-td-sec-info">
                      <strong>ST-01</strong>
                      <small>BRC – VDA</small>
                    </td>
                    <td colSpan={7} className="rn-td-track-cell">
                      <div className="rn-track-lane">
                        <div className="rn-bar-integrated" style={{ left: "2%", width: "11%" }} />
                        <div className="rn-bar-trains" style={{ left: "16%", width: "8%" }} />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="rn-td-sec-info">
                      <strong>ST-02</strong>
                      <small>VDA – AKW</small>
                    </td>
                    <td colSpan={7} className="rn-td-track-cell">
                      <div className="rn-track-lane">
                        <div className="rn-bar-integrated" style={{ left: "2%", width: "24%" }} />
                        <div className="rn-bar-trains" style={{ left: "28%", width: "22%" }} />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="rn-td-sec-info">
                      <strong>ST-03</strong>
                      <small>AKW – BHU</small>
                    </td>
                    <td colSpan={7} className="rn-td-track-cell">
                      <div className="rn-track-lane">
                        <div className="rn-bar-trains" style={{ left: "2%", width: "27%" }} />
                        <div className="rn-selected-work-group" style={{ left: "32%", width: "25%" }}>
                          <div className="rn-bar-selected-work" />
                          <div className="rn-bar-selected-work" />
                          <div className="rn-bar-selected-work" />
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="rn-td-sec-info">
                      <strong>ST-04</strong>
                      <small>BHU – SUR</small>
                    </td>
                    <td colSpan={7} className="rn-td-track-cell">
                      <div className="rn-track-lane">
                        <div className="rn-bar-trains" style={{ left: "2%", width: "16%" }} />
                        <div className="rn-selected-work-group" style={{ left: "54%", width: "24%" }}>
                          <div className="rn-bar-selected-work" />
                          <div className="rn-bar-selected-work" />
                          <div className="rn-bar-selected-work" />
                          <div className="rn-bar-selected-work" />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rn-timeline-legend">
              <div className="rn-legend-item">
                <span className="rn-legend-swatch integrated" />
                <span>Integrated Block</span>
              </div>
              <div className="rn-legend-item">
                <span className="rn-legend-swatch other-trains" />
                <span>Other Trains</span>
              </div>
              <div className="rn-legend-item">
                <span className="rn-legend-swatch selected-work" />
                <span>Selected Work</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Readiness Checklist, Approval Notes, Actions */}
        <div className="rn-approve-right-col">
          {/* Plan Readiness Checklist */}
          <div className="rn-card rn-checklist-card">
            <h2 className="rn-sidebar-section-heading">PLAN READINESS CHECKLIST</h2>
            <div className="rn-checklist-items">
              <div className="rn-check-row">
                <div className="rn-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rn-check-text">
                  <strong>All required data validated</strong>
                  <small>No major conflicts found</small>
                </div>
              </div>

              <div className="rn-check-row">
                <div className="rn-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rn-check-text">
                  <strong>All maintenance tasks scheduled</strong>
                  <small>26 / 26 tasks planned</small>
                </div>
              </div>

              <div className="rn-check-row">
                <div className="rn-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rn-check-text">
                  <strong>Safety constraints satisfied</strong>
                  <small>12 constraints applied</small>
                </div>
              </div>

              <div className="rn-check-row">
                <div className="rn-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rn-check-text">
                  <strong>No critical overlaps</strong>
                  <small>No high priority conflicts</small>
                </div>
              </div>

              <div className="rn-check-row">
                <div className="rn-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rn-check-text">
                  <strong>Windows lock status reviewed</strong>
                  <small>3 works locked</small>
                </div>
              </div>

              <div className="rn-check-row">
                <div className="rn-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rn-check-text">
                  <strong>Plan impact better than baseline</strong>
                  <small>Closure time reduced by 36%</small>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Notes */}
          <div className="rn-card rn-approval-notes-card">
            <h2 className="rn-sidebar-section-heading">APPROVAL NOTES (Optional)</h2>
            <div className="rn-notes-wrap">
              <textarea
                rows={4}
                className="rn-notes-textarea"
                placeholder="Add any notes or comments about this plan..."
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="rn-char-counter">{notes.length} / 500</span>
            </div>
          </div>

          {/* Actions Box */}
          <div className="rn-card rn-appr-actions-card">
            <h2 className="rn-sidebar-section-heading">ACTIONS</h2>

            <div className="rn-appr-actions-stack">
              <button
                type="button"
                className="rn-btn-appr-export"
                onClick={onExport}
                disabled={isBusy}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Plan (PDF)</span>
              </button>

              <button
                type="button"
                className="rn-btn-appr-submit"
                onClick={handleApproveClick}
                disabled={isBusy}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{isBusy ? "Approving..." : "Approve Plan"}</span>
              </button>

              <div className="rn-lock-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Once approved, the plan will be locked and published.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
