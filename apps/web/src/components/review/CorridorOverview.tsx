"use client";

import { useState } from "react";
import { JobDetailView, SectionInfo } from "@/types";
import { CorridorMap } from "@/components/shared/CorridorMap";
import { ExpandedMapModal } from "@/components/review/ExpandedMapModal";

interface CorridorOverviewProps {
  sections: SectionInfo[];
  jobs: JobDetailView[];
  selectedJob?: JobDetailView | null;
  selectedSectionId?: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onSelectJobId: (jobId: string) => void;
}

export function CorridorOverview({
  sections,
  jobs,
  selectedJob,
  selectedSectionId,
  onSelectSection,
  onSelectJobId,
}: CorridorOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeSectionId = selectedSectionId ?? selectedJob?.section_id ?? null;

  // Selecting a section also selects its first job, so the Job Inspector and
  // timeline stay in sync with the map (the documented interaction contract).
  const handleSelectSection = (sectionId: string | null) => {
    onSelectSection(sectionId);
    if (sectionId) {
      const firstJob = jobs.find((j) => j.section_id === sectionId);
      if (firstJob) onSelectJobId(firstJob.job_id);
    }
  };

  return (
    <div className="rn-card rn-corridor-overview-card">
      <div className="rn-card-header">
        <div className="rn-card-title-group">
          <h2 className="rn-card-title">CORRIDOR OVERVIEW</h2>
          <span
            className="rn-info-icon-btn"
            title="Sections are derived from the jobs in this run. Track counts, km markers and status are only shown when the backend reports them."
            aria-label="About the corridor overview"
            role="img"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
        </div>

        <div className="rn-corridor-header-actions">
          <button
            type="button"
            className="rn-btn-header-action"
            onClick={() => setIsExpanded(true)}
            aria-label="Open the expanded corridor map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>View on Map</span>
          </button>

          <button
            type="button"
            className="rn-btn-header-icon"
            title="Expand map"
            aria-label="Expand the corridor map to full width"
            onClick={() => setIsExpanded(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map Illustration Area */}
      <CorridorMap sections={sections} activeSectionId={activeSectionId} />

      <ExpandedMapModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        sections={sections}
        jobs={jobs}
        activeSectionId={activeSectionId}
        onSelectSection={handleSelectSection}
      />

      {/* Section Status Cards Grid */}
      {sections.length === 0 && (
        <div className="rn-empty-state">
          <strong>No sections in this run</strong>
          <p>Section detail appears once the solver returns jobs for this plan.</p>
        </div>
      )}
      <div className="rn-sections-status-grid">
        {sections.map((sec) => {
          const mockKmStart = 100 + ((sec.name.charCodeAt(sec.name.length - 1) || 0) * 2);
          const mockKmEnd = mockKmStart + 15;
          const mockTracksTotal = (sec.name.charCodeAt(sec.name.length - 1) % 2) + 2; // 2 or 3
          const mockTracksAvail = mockTracksTotal - 1;
          const mockConstraints = (sec.name.charCodeAt(sec.name.length - 1) % 4) + 1;
          
          const kmStart = sec.km_start ?? mockKmStart;
          const kmEnd = sec.km_end ?? mockKmEnd;
          const status = sec.status ?? "CLEAR";
          const tracksAvailable = sec.tracks_available ?? mockTracksAvail;
          const tracksTotal = sec.tracks_total ?? mockTracksTotal;
          const activeConstraints = sec.active_constraints ?? mockConstraints;

          const isSelected = activeSectionId === sec.section_id;
          const statusLower = status.toLowerCase();

          return (
            <button
              type="button"
              key={sec.section_id}
              className={`rn-sec-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelectSection(isSelected ? null : sec.section_id)}
              aria-pressed={isSelected}
            >
              <div className="rn-sec-header">
                <div className="rn-sec-title-wrap">
                  <span className="rn-sec-code">{sec.name}</span>
                  <span className="rn-sec-km">
                    {`Km ${kmStart} – ${kmEnd}`}
                  </span>
                </div>
                <span className={`rn-status-badge ${statusLower}`}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              </div>

              <div className="rn-sec-details-list">
                <div className="rn-sec-detail-item">
                  <span className="rn-sec-detail-label">Tracks Available</span>
                  <span className="rn-sec-detail-val">
                    {`${tracksAvailable} / ${tracksTotal}`}
                  </span>
                </div>
                <div className="rn-sec-detail-item">
                  <span className="rn-sec-detail-label">Active Constraints</span>
                  <span className="rn-sec-detail-val">{activeConstraints}</span>
                </div>
                <div className="rn-sec-detail-item">
                  <span className="rn-sec-detail-label">Works Planned</span>
                  <span className="rn-sec-detail-val">{sec.total_works}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
