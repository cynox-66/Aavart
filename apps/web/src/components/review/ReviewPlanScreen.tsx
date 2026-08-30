"use client";

import { useMemo, useState } from "react";
import { JobDetailView, OptimizationStatus, PlanRunView } from "@/types";
import { CorridorOverview } from "@/components/review/CorridorOverview";
import { WeeklyTimelineSummary } from "@/components/review/WeeklyTimelineSummary";
import { ExpandedTimelineModal } from "@/components/review/ExpandedTimelineModal";
import { PlanImpact } from "@/components/review/PlanImpact";
import { JobInspector } from "@/components/review/JobInspector";
import { GlobalPlanActions } from "@/components/review/GlobalPlanActions";

interface ReviewPlanScreenProps {
  plan: PlanRunView;
  isDirty: boolean;
  lockedCount: number;
  optimizationStatus: OptimizationStatus;
  isBusy: boolean;
  onLockJob: (jobId: string) => Promise<void>;
  onChangeWindow: (jobId: string, newWindowId: string) => void;
  onFindAlternative: (jobId: string) => void;
  onExcludeJob: (jobId: string) => void;
  onReoptimize: () => Promise<void>;
  onApproveStep: () => void;
  onExport: () => Promise<void>;
  onNewVersion?: () => void;
}

export function ReviewPlanScreen({
  plan,
  isDirty,
  lockedCount,
  isBusy,
  onLockJob,
  onChangeWindow,
  onFindAlternative,
  onExcludeJob,
  onReoptimize,
  onApproveStep,
  onExport,
  onNewVersion,
}: ReviewPlanScreenProps) {
  // Default selected job to JOB-042 (index 1 / 2 of 26) as shown in Image 4
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    plan.jobs.find((j) => j.job_id === "JOB-042")?.job_id ?? plan.jobs[0]?.job_id ?? null,
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isExpandedTimelineOpen, setIsExpandedTimelineOpen] = useState(false);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return plan.jobs[1] ?? plan.jobs[0] ?? null;
    return plan.jobs.find((j) => j.job_id === selectedJobId) ?? plan.jobs[1] ?? plan.jobs[0] ?? null;
  }, [plan.jobs, selectedJobId]);

  const currentIndex = useMemo(() => {
    if (!selectedJob) return 1;
    const idx = plan.jobs.findIndex((j) => j.job_id === selectedJob.job_id);
    return idx >= 0 ? idx : 1;
  }, [plan.jobs, selectedJob]);

  const handlePrevJob = () => {
    if (plan.jobs.length === 0) return;
    const prevIdx = (currentIndex - 1 + plan.jobs.length) % plan.jobs.length;
    setSelectedJobId(plan.jobs[prevIdx].job_id);
  };

  const handleNextJob = () => {
    if (plan.jobs.length === 0) return;
    const nextIdx = (currentIndex + 1) % plan.jobs.length;
    setSelectedJobId(plan.jobs[nextIdx].job_id);
  };

  const isApproved = Boolean(plan.approval);

  return (
    <div className="rn-review-workspace">
      <div className="rn-review-grid">
        {/* Left Column: Corridor Map, Timeline & Impact, Important Notice Banner */}
        <div className="rn-review-main-col">
          {/* 1. Corridor Overview */}
          <CorridorOverview
            sections={plan.sections}
            selectedJob={selectedJob}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            onSelectJobId={setSelectedJobId}
          />

          {/* 2. Middle Row: Weekly Timeline Overview + Plan Impact */}
          <div className="rn-review-mid-grid">
            <WeeklyTimelineSummary
              plan={plan}
              selectedJobId={selectedJobId}
              onSelectJobId={setSelectedJobId}
              onExpandTimeline={() => setIsExpandedTimelineOpen(true)}
            />

            <PlanImpact kpis={plan.kpis} />
          </div>

          {/* 3. Bottom Important Notice Banner */}
          <div className="rn-important-banner">
            <div className="rn-important-left">
              <div className="rn-info-circle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="rn-important-text">
                <strong>Important</strong>
                <p>This plan is locked. Global changes will require re-optimizing the plan.</p>
              </div>
            </div>

            <button
              type="button"
              className="rn-btn-reoptimize-banner"
              onClick={onReoptimize}
              disabled={isBusy}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Re-Optimize Plan</span>
            </button>
          </div>
        </div>

        {/* Right Column: Job Inspector & Global Plan Actions */}
        <div className="rn-review-sidebar-col">
          <JobInspector
            plan={plan}
            selectedJob={selectedJob}
            currentIndex={currentIndex}
            totalJobs={plan.jobs.length}
            onPrevJob={handlePrevJob}
            onNextJob={handleNextJob}
            isApproved={isApproved}
            isBusy={isBusy}
            onLockJob={onLockJob}
            onChangeWindow={onChangeWindow}
            onFindAlternative={onFindAlternative}
            onExcludeJob={onExcludeJob}
          />

          <GlobalPlanActions
            isDirty={isDirty}
            lockedJobCount={lockedCount}
            isApproved={isApproved}
            isBusy={isBusy}
            onReoptimize={onReoptimize}
            onApproveStep={onApproveStep}
            onExport={onExport}
            onNewVersion={onNewVersion}
          />
        </div>
      </div>

      {/* Expanded Timeline Modal */}
      <ExpandedTimelineModal
        isOpen={isExpandedTimelineOpen}
        onClose={() => setIsExpandedTimelineOpen(false)}
        plan={plan}
        selectedJobId={selectedJobId}
        onSelectJobId={setSelectedJobId}
      />
    </div>
  );
}
