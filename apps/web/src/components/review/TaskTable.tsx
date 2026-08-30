"use client";

import { useMemo, useState } from "react";
import { DepartmentType, PlanRunView } from "@/types";
import { formatStamp, formatTime } from "@/lib/utils";

interface TaskTableProps {
  plan: PlanRunView;
  selectedJobId: string | null;
  onSelectJobId: (jobId: string) => void;
}

type TabType = "all" | "integrated" | "selected" | "other";

export function TaskTable({ plan, selectedJobId, onSelectJobId }: TaskTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState<DepartmentType | "ALL">("ALL");

  const scheduleMap = useMemo(
    () => new Map(plan.schedule_items.map((s) => [s.job_id, s])),
    [plan.schedule_items],
  );

  const integratedCount = plan.schedule_items.filter((s) => s.is_integrated_block).length;
  const totalCount = plan.jobs.length;

  const filteredJobs = useMemo(() => {
    return plan.jobs.filter((job) => {
      const schedule = scheduleMap.get(job.job_id);

      // Tab filter
      if (activeTab === "integrated" && !schedule?.is_integrated_block) return false;
      if (activeTab === "selected" && job.job_id !== selectedJobId) return false;
      if (activeTab === "other" && schedule?.is_integrated_block) return false;

      // Dept filter
      if (deptFilter !== "ALL" && job.department !== deptFilter) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = job.job_id.toLowerCase().includes(term);
        const matchesWork = job.work_type.toLowerCase().includes(term);
        const matchesSec = job.section_id.toLowerCase().includes(term);
        const matchesAsset = job.asset_id.toLowerCase().includes(term);
        if (!matchesId && !matchesWork && !matchesSec && !matchesAsset) return false;
      }

      return true;
    });
  }, [plan.jobs, scheduleMap, activeTab, selectedJobId, deptFilter, searchTerm]);

  return (
    <div className="task-table-card" aria-labelledby="tasks-heading">
      <div className="task-table-topline">
        <div className="table-heading-group">
          <span className="mono-kicker">WORK ORDER REGISTRY</span>
          <h3 id="tasks-heading">Corridor Maintenance Tasks</h3>
        </div>

        {/* Search & Dept Controls */}
        <div className="table-filter-controls">
          <div className="table-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="table-search-input"
              placeholder="Search by Job ID, work type, asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="btn-clear-search" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>

          <select
            className="table-dept-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as DepartmentType)}
          >
            <option value="ALL">All Departments</option>
            <option value="TRACK">Track (TMS)</option>
            <option value="SIGNAL">Signal (SMMS)</option>
            <option value="ELECTRICAL">Traction (TDMS)</option>
            <option value="CIVIL">Civil Works</option>
          </select>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="task-tabs-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className={`task-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Tasks <span className="tab-badge">{totalCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "integrated"}
          className={`task-tab tab-integrated ${activeTab === "integrated" ? "active" : ""}`}
          onClick={() => setActiveTab("integrated")}
        >
          ★ Integrated Blocks <span className="tab-badge">{integratedCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "selected"}
          className={`task-tab ${activeTab === "selected" ? "active" : ""}`}
          onClick={() => setActiveTab("selected")}
        >
          Selected Job <span className="tab-badge">{selectedJobId ? "1" : "0"}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "other"}
          className={`task-tab ${activeTab === "other" ? "active" : ""}`}
          onClick={() => setActiveTab("other")}
        >
          Standard Work <span className="tab-badge">{totalCount - integratedCount}</span>
        </button>
      </div>

      {/* Tasks Table */}
      <div className="task-table-wrapper">
        <table className="tasks-data-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Department</th>
              <th>Section / Location</th>
              <th>Maintenance Work Type</th>
              <th>Window / Time</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Audit Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => {
              const isSelected = selectedJobId === job.job_id;
              const schedule = scheduleMap.get(job.job_id);
              const isIntegrated = schedule?.is_integrated_block;

              return (
                <tr
                  key={job.job_id}
                  className={`task-row ${isSelected ? "selected" : ""} ${
                    isIntegrated ? "integrated-row" : ""
                  }`}
                  onClick={() => onSelectJobId(job.job_id)}
                >
                  <td className="job-id-cell">
                    <span className="mono-job-id">
                      {job.locked && <span className="lock-icon-sm">🔒</span>}
                      {isIntegrated && <span className="star-icon-sm">★</span>}
                      {job.job_id}
                    </span>
                  </td>
                  <td>
                    <span className={`dept-pill ${job.department.toLowerCase()}`}>
                      {job.department}
                    </span>
                  </td>
                  <td>
                    <strong>{job.section_id}</strong>
                    <small className="cell-km">{job.location_km}</small>
                  </td>
                  <td className="work-type-cell">
                    <span>{job.work_type}</span>
                  </td>
                  <td className="time-cell">
                    {schedule ? (
                      <>
                        <strong>{formatTime(schedule.start)} → {formatTime(schedule.end)}</strong>
                        <small className="cell-date">{formatStamp(schedule.start)}</small>
                      </>
                    ) : (
                      <span className="unscheduled-label">UNSCHEDULED</span>
                    )}
                  </td>
                  <td>
                    <span className={`priority-pill ${job.priority_label.toLowerCase()}`}>
                      P{job.priority} ({job.priority_label})
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${job.status.toLowerCase()}`}>
                      {job.locked ? "LOCKED" : job.status}
                    </span>
                  </td>
                  <td className="reason-cell">
                    <span className="reason-code-tag">
                      {job.reason_codes[0]?.replaceAll("_", " ") || "SCHEDULED"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  No maintenance tasks match the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
