"use client";

import { PlanRunView } from "@/types";
import { formatDateRange, formatTime, getScheduleDateRange, getDepartmentLabel } from "@/lib/utils";
import { useMemo } from "react";

interface WeeklyTimelineSummaryProps {
  plan: PlanRunView;
  selectedJobId: string | null;
  onSelectJobId: (jobId: string) => void;
  onExpandTimeline: () => void;
}

/** Build day boundaries (midnight-to-midnight) spanning the schedule range. */
function getDayColumns(start: Date | null, end: Date | null): Array<{ label: string; date: string; startMs: number; endMs: number }> {
  if (!start || !end) return [];
  const days: Array<{ label: string; date: string; startMs: number; endMs: number }> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const ceiling = new Date(end);
  ceiling.setHours(23, 59, 59, 999);
  while (cursor <= ceiling) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);
    days.push({
      label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
      date: dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      startMs: dayStart.getTime(),
      endMs: dayEnd.getTime(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function WeeklyTimelineSummary({
  plan,
  selectedJobId,
  onExpandTimeline,
  onSelectJobId,
}: WeeklyTimelineSummaryProps) {
  const { start, end } = getScheduleDateRange(plan.schedule_items);
  const spanMs = start && end ? end.getTime() - start.getTime() : 0;

  const days = useMemo(() => getDayColumns(start, end), [start, end]);

  const jobsBySectionAndId = new Map(plan.jobs.map((j) => [j.job_id, j]));

  const rows = plan.sections.map((section) => {
    const items = plan.schedule_items.filter((s) => {
      const job = jobsBySectionAndId.get(s.job_id);
      return job?.section_id === section.section_id;
    });
    return { section, items };
  });

  const barLeft = (itemStart: string) => {
    if (!start || spanMs <= 0) return 0;
    return Math.max(0, Math.min(100, ((new Date(itemStart).getTime() - start.getTime()) / spanMs) * 100));
  };

  const barWidth = (itemStart: string, itemEnd: string) => {
    if (spanMs <= 0) return 100;
    const s = new Date(itemStart).getTime();
    const e = new Date(itemEnd).getTime();
    const left = Math.max(0, ((s - (start?.getTime() ?? s)) / spanMs) * 100);
    return Math.max(1.5, Math.min(100 - left, ((e - s) / spanMs) * 100));
  };

  /** Resolve the bar's department color from the underlying job. */
  const barColor = (jobId: string): string => {
    const job = jobsBySectionAndId.get(jobId);
    if (!job) return "#94A3B8";
    return getDepartmentLabel(job.department).color;
  };

  /** Build a human-readable tooltip for the bar. */
  const barTooltip = (item: (typeof plan.schedule_items)[number]): string => {
    const job = jobsBySectionAndId.get(item.job_id);
    const dept = job ? getDepartmentLabel(job.department).tag : "—";
    const timeRange = `${formatTime(item.start)} – ${formatTime(item.end)}`;
    const lockStr = item.locked ? " 🔒" : "";
    return `${item.job_id} · ${dept} · ${timeRange}${lockStr}`;
  };

  /** Gridline positions (left %) for day boundaries. */
  const gridlines = useMemo(() => {
    if (!start || spanMs <= 0 || days.length <= 1) return [];
    return days.slice(1).map((d) => ((d.startMs - start.getTime()) / spanMs) * 100);
  }, [start, spanMs, days]);

  const scheduledCount = plan.schedule_items.length;
  const unscheduledCount = plan.unscheduled_jobs.length;

  return (
    <div className="rn-card rn-timeline-card">
      {/* Header */}
      <div className="rn-card-header">
        <div className="wt-header-left">
          <h2 className="rn-card-title">
            <svg className="wt-icon-calendar" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Weekly Timeline Overview
          </h2>
          <span className="wt-date-badge">{formatDateRange(start, end)}</span>
        </div>
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

      {/* Summary chips */}
      <div className="wt-summary-row">
        <span className="wt-chip wt-chip-scheduled">
          <span className="wt-chip-dot scheduled" />
          {scheduledCount} Scheduled
        </span>
        {unscheduledCount > 0 && (
          <span className="wt-chip wt-chip-unscheduled">
            <span className="wt-chip-dot unscheduled" />
            {unscheduledCount} Unscheduled
          </span>
        )}
        <span className="wt-chip wt-chip-locked">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          {plan.schedule_items.filter((s) => s.locked).length} Locked
        </span>
      </div>

      {/* Day axis header */}
      {days.length > 0 && (
        <div className="wt-day-axis">
          <div className="wt-day-axis-spacer" />
          <div className="wt-day-axis-cols">
            {days.map((d) => (
              <div key={d.startMs} className="wt-day-col">
                <b>{d.label}</b>
                <i>{d.date}</i>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gantt rows */}
      <div className="wt-gantt-wrap">
        {rows.length === 0 && (
          <div className="wt-empty-state">No sections in this plan yet.</div>
        )}
        {rows.map(({ section, items }) => (
          <div key={section.section_id} className="wt-gantt-row">
            {/* Section label */}
            <div className="wt-section-label">
              <strong>{section.section_id}</strong>
              {section.from_node && section.to_node && (
                <small>{section.from_node} – {section.to_node}</small>
              )}
              <span className="wt-job-count-badge">{items.length} {items.length === 1 ? "job" : "jobs"}</span>
            </div>

            {/* Track lane */}
            <div className="wt-track-lane">
              {/* Gridlines */}
              {gridlines.map((pct) => (
                <div key={pct} className="wt-gridline" style={{ left: `${pct}%` }} />
              ))}

              {/* Bars */}
              {items.length === 0 && <span className="wt-track-empty">No scheduled work</span>}
              {items.map((item, index) => {
                const color = barColor(item.job_id);
                const isSelected = selectedJobId === item.job_id;
                const isIntegrated = !!item.is_integrated_block;
                const isLocked = !!item.locked;
                return (
                  <button
                    type="button"
                    key={item.job_id}
                    className={`wt-bar${isSelected ? " wt-bar-selected" : ""}${isIntegrated ? " wt-bar-integrated" : ""}${isLocked ? " wt-bar-locked" : ""}`}
                    style={{
                      left: `${barLeft(item.start)}%`,
                      width: `${barWidth(item.start, item.end)}%`,
                      top: `${4 + index * 24}px`,
                      backgroundColor: isIntegrated ? "var(--block-purple)" : color,
                      borderColor: isIntegrated ? "var(--block-purple-dark)" : color,
                    }}
                    onClick={() => onSelectJobId(item.job_id)}
                    title={barTooltip(item)}
                    aria-label={`Select ${item.job_id} (${item.status})`}
                    aria-pressed={isSelected}
                  >
                    {isLocked && (
                      <svg className="wt-lock-icon" width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="wt-legend">
        <div className="wt-legend-item">
          <span className="wt-legend-swatch" style={{ backgroundColor: "#e4a041" }} />
          <span>TMS (Track)</span>
        </div>
        <div className="wt-legend-item">
          <span className="wt-legend-swatch" style={{ backgroundColor: "#6587c9" }} />
          <span>SMMS (Signal)</span>
        </div>
        <div className="wt-legend-item">
          <span className="wt-legend-swatch" style={{ backgroundColor: "#5ca978" }} />
          <span>TDMS (Traction)</span>
        </div>
        <div className="wt-legend-item">
          <span className="wt-legend-swatch wt-legend-integrated" />
          <span>Integrated Block</span>
        </div>
        <div className="wt-legend-item">
          <svg className="wt-legend-lock" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
}
