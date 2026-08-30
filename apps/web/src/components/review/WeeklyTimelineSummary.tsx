"use client";

import { PlanRunView } from "@/types";

interface WeeklyTimelineSummaryProps {
  plan: PlanRunView;
  selectedJobId: string | null;
  onSelectJobId: (jobId: string) => void;
  onExpandTimeline: () => void;
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

export function WeeklyTimelineSummary({
  onExpandTimeline,
  onSelectJobId,
}: WeeklyTimelineSummaryProps) {
  return (
    <div className="rn-card rn-timeline-card">
      <div className="rn-card-header">
        <h2 className="rn-card-title">WEEKLY TIMELINE OVERVIEW (18 Aug – 24 Aug 2026)</h2>
        <button
          type="button"
          className="rn-btn-expand-timeline"
          onClick={onExpandTimeline}
        >
          <span>Expand Timeline</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      {/* Gantt Table Grid */}
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
            {/* ST-01 (BRC - VDA) */}
            <tr>
              <td className="rn-td-sec-info">
                <strong>ST-01</strong>
                <small>BRC – VDA</small>
              </td>
              <td colSpan={7} className="rn-td-track-cell">
                <div className="rn-track-lane">
                  {/* Mon: Integrated Block */}
                  <div
                    className="rn-bar-integrated"
                    style={{ left: "2%", width: "11%" }}
                    onClick={() => onSelectJobId("JOB-001")}
                    title="Integrated Block: ST-01 (Mon)"
                  />
                  {/* Tue: Other Trains */}
                  <div
                    className="rn-bar-trains"
                    style={{ left: "16%", width: "8%" }}
                    title="Other Trains: Regular Scheduled Passenger Movement"
                  />
                </div>
              </td>
            </tr>

            {/* ST-02 (VDA - AKW) */}
            <tr>
              <td className="rn-td-sec-info">
                <strong>ST-02</strong>
                <small>VDA – AKW</small>
              </td>
              <td colSpan={7} className="rn-td-track-cell">
                <div className="rn-track-lane">
                  {/* Mon - Tue: Integrated Block */}
                  <div
                    className="rn-bar-integrated"
                    style={{ left: "2%", width: "24%" }}
                    onClick={() => onSelectJobId("JOB-008")}
                    title="Integrated Block: ST-02 (Mon - Tue)"
                  />
                  {/* Wed: Other Trains */}
                  <div
                    className="rn-bar-trains"
                    style={{ left: "28%", width: "22%" }}
                    title="Other Trains: Express Corridor Operations"
                  />
                </div>
              </td>
            </tr>

            {/* ST-03 (AKW - BHU) */}
            <tr>
              <td className="rn-td-sec-info">
                <strong>ST-03</strong>
                <small>AKW – BHU</small>
              </td>
              <td colSpan={7} className="rn-td-track-cell">
                <div className="rn-track-lane">
                  {/* Mon - Tue: Other Trains */}
                  <div
                    className="rn-bar-trains"
                    style={{ left: "2%", width: "27%" }}
                    title="Other Trains: Intercity Freight & Express"
                  />
                  {/* Wed - Fri: Selected Work */}
                  <div className="rn-selected-work-group" style={{ left: "32%", width: "25%" }}>
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-042")} title="JOB-042: Rail Fracture (Wed)" />
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-015")} title="JOB-015: Signal Point Overhaul (Thu)" />
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-042")} title="JOB-042: Ultrasonic Testing (Fri)" />
                  </div>
                </div>
              </td>
            </tr>

            {/* ST-04 (BHU - SUR) */}
            <tr>
              <td className="rn-td-sec-info">
                <strong>ST-04</strong>
                <small>BHU – SUR</small>
              </td>
              <td colSpan={7} className="rn-td-track-cell">
                <div className="rn-track-lane">
                  {/* Mon: Other Trains */}
                  <div
                    className="rn-bar-trains"
                    style={{ left: "2%", width: "16%" }}
                    title="Other Trains: Surat Suburban Movements"
                  />
                  {/* Thu - Sun: Selected Work */}
                  <div className="rn-selected-work-group" style={{ left: "54%", width: "24%" }}>
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-027")} title="JOB-027: Ballast Tamping (Thu)" />
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-027")} title="JOB-027: Deep Screening (Fri)" />
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-027")} title="JOB-027: Track Packing (Sat)" />
                    <div className="rn-bar-selected-work" onClick={() => onSelectJobId("JOB-027")} title="JOB-027: Final Inspection (Sun)" />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Timeline Legend */}
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
  );
}
