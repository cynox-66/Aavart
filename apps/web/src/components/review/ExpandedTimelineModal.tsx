"use client";

import { useState } from "react";
import { DepartmentType, JobDetailView, PlanRunView } from "@/types";
import { formatStamp, formatTime } from "@/lib/utils";

interface ExpandedTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanRunView;
  selectedJobId: string | null;
  onSelectJobId: (jobId: string) => void;
}

export function ExpandedTimelineModal({
  isOpen,
  onClose,
  plan,
  selectedJobId,
  onSelectJobId,
}: ExpandedTimelineModalProps) {
  const [filterDept, setFilterDept] = useState<DepartmentType | "ALL">("ALL");
  const [zoomLevel, setZoomLevel] = useState<"1x" | "2x">("1x");

  if (!isOpen) return null;

  const jobsMap = new Map(plan.jobs.map((j) => [j.job_id, j]));

  const filteredSchedule = plan.schedule_items.filter((item) => {
    const job = jobsMap.get(item.job_id);
    if (filterDept !== "ALL" && job?.department !== filterDept) return false;
    return true;
  });

  return (
    <div className="modal-backdrop expanded-timeline-backdrop" role="dialog" aria-modal="true">
      <div className="expanded-timeline-dialog">
        <div className="expanded-top-bar">
          <div>
            <span className="mono-kicker">DETAILED OPERATIONS VIEW</span>
            <h2>High-Resolution Corridor Timeline (18 Aug – 24 Aug 2026)</h2>
          </div>

          <div className="expanded-controls-group">
            {/* Department Filter Pills */}
            <div className="dept-filter-buttons">
              {(["ALL", "TRACK", "SIGNAL", "ELECTRICAL", "CIVIL"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`btn-filter-pill ${filterDept === d ? "active" : ""}`}
                  onClick={() => setFilterDept(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Zoom Toggle */}
            <div className="zoom-switch">
              <button
                type="button"
                className={`btn-zoom ${zoomLevel === "1x" ? "active" : ""}`}
                onClick={() => setZoomLevel("1x")}
              >
                1x Scale
              </button>
              <button
                type="button"
                className={`btn-zoom ${zoomLevel === "2x" ? "active" : ""}`}
                onClick={() => setZoomLevel("2x")}
              >
                2x Zoom
              </button>
            </div>

            <button type="button" className="btn-close-expanded" onClick={onClose}>
              ✕ Collapse View
            </button>
          </div>
        </div>

        {/* Detailed Timeline Scroll Container */}
        <div className={`expanded-scroll-area zoom-${zoomLevel}`}>
          <div className="expanded-schedule-table">
            {filteredSchedule.map((item) => {
              const job = jobsMap.get(item.job_id);
              const isSelected = selectedJobId === item.job_id;
              const isIntegrated = item.is_integrated_block;

              return (
                <div
                  key={item.job_id}
                  className={`expanded-job-card ${isSelected ? "selected" : ""} ${
                    isIntegrated ? "integrated" : ""
                  }`}
                  onClick={() => onSelectJobId(item.job_id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="job-card-topline">
                    <div className="job-id-dept">
                      <span className={`dept-badge-sm ${job?.department.toLowerCase()}`}>
                        {job?.department}
                      </span>
                      <strong>{item.job_id}</strong>
                      {isIntegrated && <span className="tag-joint">★ INTEGRATED BLOCK</span>}
                      {item.locked && <span className="tag-locked">🔒 LOCKED</span>}
                    </div>

                    <div className="job-window-badge">
                      <span>Window: {item.window_id}</span>
                    </div>
                  </div>

                  <h4 className="job-work-title">{job?.work_type}</h4>

                  <div className="job-meta-row">
                    <span>📍 Section: {job?.section_id}</span>
                    <span>⏱️ Time: {formatStamp(item.start)} → {formatTime(item.end)}</span>
                    <span>🎯 Priority: P{job?.priority} ({job?.priority_label})</span>
                  </div>

                  <div className="job-reasons-strip">
                    <small>Audit Reasons:</small>
                    {item.reason_codes.map((c) => (
                      <span key={c} className="reason-pill-sm">{c}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
