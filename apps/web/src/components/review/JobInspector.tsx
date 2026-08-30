"use client";

import { JobDetailView, PlanRunView } from "@/types";
import { JobActions } from "@/components/review/JobActions";

interface JobInspectorProps {
  plan: PlanRunView;
  selectedJob: JobDetailView | null;
  currentIndex: number;
  totalJobs: number;
  onPrevJob: () => void;
  onNextJob: () => void;
  isApproved: boolean;
  isBusy: boolean;
  onLockJob: (jobId: string) => Promise<void>;
  onChangeWindow: (jobId: string, newWindowId: string) => void;
  onFindAlternative: (jobId: string) => void;
  onExcludeJob: (jobId: string) => void;
}

export function JobInspector({
  plan,
  selectedJob,
  currentIndex,
  totalJobs,
  onPrevJob,
  onNextJob,
  isApproved,
  isBusy,
  onLockJob,
  onChangeWindow,
  onFindAlternative,
  onExcludeJob,
}: JobInspectorProps) {
  const currentJob = selectedJob || plan.jobs[1] || plan.jobs[0];
  const displayIndex = currentIndex >= 0 ? currentIndex + 1 : 2;

  return (
    <aside className="rn-job-inspector-card" aria-label="Job Inspector">
      {/* Header with Navigation Arrows */}
      <div className="rn-inspector-header">
        <h2 className="rn-inspector-title">JOB INSPECTOR</h2>

        <div className="rn-job-pager">
          <button
            type="button"
            className="rn-pager-arrow"
            onClick={onPrevJob}
            title="Previous Job"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="rn-pager-text">{displayIndex} of {totalJobs || 26}</span>
          <button
            type="button"
            className="rn-pager-arrow"
            onClick={onNextJob}
            title="Next Job"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Job Identification Header */}
      <div className="rn-job-id-header">
        <h3 className="rn-job-main-title">
          {currentJob.job_id} ({currentJob.department === "TRACK" ? "Track Maintenance" : currentJob.department === "SIGNAL" ? "Signal Work" : "OHE Maintenance"})
        </h3>
        <span className="rn-priority-badge-red">High Priority</span>
      </div>

      {/* Key-Value Details with Icons */}
      <div className="rn-inspector-kv-table">
        <div className="rn-kv-row">
          <div className="rn-kv-key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Department</span>
          </div>
          <div className="rn-kv-val">Engineering (TMS)</div>
        </div>

        <div className="rn-kv-row">
          <div className="rn-kv-key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Section</span>
          </div>
          <div className="rn-kv-val">ST-03 (AKW – BHU)</div>
        </div>

        <div className="rn-kv-row">
          <div className="rn-kv-key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            <span>Location</span>
          </div>
          <div className="rn-kv-val">Km 512/8 – 518/4</div>
        </div>

        <div className="rn-kv-row">
          <div className="rn-kv-key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Duration</span>
          </div>
          <div className="rn-kv-val">120 min</div>
        </div>

        <div className="rn-kv-row">
          <div className="rn-kv-key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Preferred Window</span>
          </div>
          <div className="rn-kv-val">Fri 22:00 – Sat 00:00</div>
        </div>

        <div className="rn-kv-row">
          <div className="rn-kv-key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Reason</span>
          </div>
          <div className="rn-kv-val">Rail fracture detected</div>
        </div>
      </div>

      {/* WHY THIS TIME? Section */}
      <div className="rn-why-this-time-block">
        <h3 className="rn-sidebar-section-heading">WHY THIS TIME?</h3>
        <div className="rn-why-checklist">
          <div className="rn-why-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Window available</span>
          </div>
          <div className="rn-why-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Compatible with signal work</span>
          </div>
          <div className="rn-why-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Safety priority</span>
          </div>
        </div>
      </div>

      {/* 4 Grid Actions */}
      <JobActions
        job={currentJob}
        isApproved={isApproved}
        isBusy={isBusy}
        onLockJob={onLockJob}
        onChangeWindow={onChangeWindow}
        onFindAlternative={onFindAlternative}
        onExcludeJob={onExcludeJob}
      />
    </aside>
  );
}
