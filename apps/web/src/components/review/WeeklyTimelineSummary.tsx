"use client";

import { PlanRunView } from "@/types";
import { formatDateRange, getScheduleDateRange } from "@/lib/utils";

interface WeeklyTimelineSummaryProps {
  plan: PlanRunView;
  selectedJobId: string | null;
  onSelectJobId: (jobId: string) => void;
  onExpandTimeline: () => void;
}

export function WeeklyTimelineSummary({
  plan,
  selectedJobId,
  onExpandTimeline,
  onSelectJobId,
}: WeeklyTimelineSummaryProps) {
  const { start, end } = getScheduleDateRange(plan.schedule_items);
  const spanMs = start && end ? end.getTime() - start.getTime() : 0;

  const jobsBySectionAndId = new Map(plan.jobs.map((j) => [j.job_id, j]));

  const rows = plan.sections.map((section) => {
    const items = plan.schedule_items.filter((s) => {
      const job = jobsBySectionAndId.get(s.job_id);
      return job?.section_id === section.section_id;
    });
    return { section, items };
  });

  const barStyle = (itemStart: string, itemEnd: string) => {
    if (!start || spanMs <= 0) return { left: "0%", width: "100%" };
    const s = new Date(itemStart).getTime();
    const e = new Date(itemEnd).getTime();
    const left = Math.max(0, Math.min(100, ((s - start.getTime()) / spanMs) * 100));
    const width = Math.max(1, Math.min(100 - left, ((e - s) / spanMs) * 100));
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="rn-card rn-timeline-card">
      <div className="rn-card-header">
        <h2 className="rn-card-title">WEEKLY TIMELINE OVERVIEW ({formatDateRange(start, end)})</h2>
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

      {/* Gantt Table Grid - one row per real section, bars from real schedule_items */}
      <div className="rn-gantt-table-wrap">
        <table className="rn-gantt-table">
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="rn-td-sec-info">No sections in this plan yet.</td>
              </tr>
            )}
            {rows.map(({ section, items }) => (
              <tr key={section.section_id}>
                <td className="rn-td-sec-info">
                  <strong>{section.section_id}</strong>
                  {section.from_node && section.to_node && (
                    <small>{section.from_node} – {section.to_node}</small>
                  )}
                </td>
                <td className="rn-td-track-cell">
                  <div className="rn-track-lane">
                    {items.length === 0 && <span className="rn-track-empty">No scheduled work</span>}
                    {items.map((item) => (
                      <button
                        type="button"
                        key={item.job_id}
                        className={item.is_integrated_block ? "rn-bar-integrated" : item.locked ? "rn-bar-selected-work" : "rn-bar-trains"}
                        style={barStyle(item.start, item.end)}
                        onClick={() => onSelectJobId(item.job_id)}
                        title={`${item.job_id}: ${item.status}`}
                        aria-label={`Select ${item.job_id} (${item.status})`}
                        aria-pressed={selectedJobId === item.job_id}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
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
          <span className="rn-legend-swatch selected-work" />
          <span>Locked Work</span>
        </div>
        <div className="rn-legend-item">
          <span className="rn-legend-swatch other-trains" />
          <span>Scheduled Work</span>
        </div>
      </div>
    </div>
  );
}
