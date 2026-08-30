"use client";

import { useState } from "react";
import { JobDetailView, SectionInfo } from "@/types";

interface CorridorOverviewProps {
  sections: SectionInfo[];
  selectedJob?: JobDetailView | null;
  selectedSectionId?: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onSelectJobId: (jobId: string) => void;
}

export function CorridorOverview({
  sections,
  selectedJob,
  selectedSectionId,
  onSelectSection,
}: CorridorOverviewProps) {
  const [mapMode, setMapMode] = useState<"map" | "schematic">("map");
  const activeSectionId = selectedSectionId ?? selectedJob?.section_id ?? null;

  return (
    <div className="rn-card rn-corridor-overview-card">
      <div className="rn-card-header">
        <div className="rn-card-title-group">
          <h2 className="rn-card-title">CORRIDOR OVERVIEW</h2>
          <button type="button" className="rn-info-icon-btn" title="Corridor Information">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>

        <div className="rn-corridor-header-actions">
          <button
            type="button"
            className="rn-btn-header-action"
            onClick={() => setMapMode(mapMode === "map" ? "schematic" : "map")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>{mapMode === "map" ? "View on Map" : "View Schematic"}</span>
          </button>

          <button type="button" className="rn-btn-header-icon" title="Expand Map">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map Illustration Area */}
      <div className="rn-corridor-map-wrap">
        <svg viewBox="0 0 880 140" className="rn-corridor-map-svg">
          <defs>
            {/* Soft map background texture */}
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
            </pattern>
            {/* Terrain hills / water body contours */}
            <linearGradient id="terrainGrad" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="40%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>

          {/* Map canvas background */}
          <rect x="0" y="0" width="880" height="140" fill="#F8FAFC" rx="8" />
          <rect x="0" y="0" width="880" height="140" fill="url(#mapGrid)" rx="8" />

          {/* Gentle terrain curves */}
          <path
            d="M 0 110 C 140 100, 220 130, 420 115 C 600 100, 720 125, 880 110 L 880 140 L 0 140 Z"
            fill="#EFF6FF"
            opacity="0.6"
          />
          <path
            d="M 0 40 C 160 55, 300 25, 500 45 C 680 60, 780 35, 880 50 L 880 0 L 0 0 Z"
            fill="#F0FDF4"
            opacity="0.5"
          />

          {/* Main Track Line with Status-Colored Segments */}
          {/* Base track bed */}
          <line x1="60" y1="70" x2="820" y2="70" stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />

          {/* Segment 1: BRC to VDA (Clear - Green) */}
          <line
            x1="60"
            y1="70"
            x2="250"
            y2="70"
            stroke="#16A34A"
            strokeWidth={activeSectionId === "ST-01" ? "6" : "4"}
            strokeLinecap="round"
          />

          {/* Segment 2: VDA to AKW (Caution - Orange) */}
          <line
            x1="250"
            y1="70"
            x2="440"
            y2="70"
            stroke="#F59E0B"
            strokeWidth={activeSectionId === "ST-02" ? "6" : "4"}
          />

          {/* Segment 3: AKW to BHU (Restricted - Red / Integrated Block) */}
          <line
            x1="440"
            y1="70"
            x2="630"
            y2="70"
            stroke="#EF4444"
            strokeWidth={activeSectionId === "ST-03" ? "7" : "5"}
          />

          {/* Segment 4: BHU to SUR (Clear - Green) */}
          <line
            x1="630"
            y1="70"
            x2="820"
            y2="70"
            stroke="#16A34A"
            strokeWidth={activeSectionId === "ST-04" ? "6" : "4"}
            strokeLinecap="round"
          />

          {/* Station Nodes (BRC, VDA, AKW, BHU, SUR) */}
          {[
            { id: "BRC", name: "Bharuch Jn.", x: 60, y: 70 },
            { id: "VDA", name: "Vadodara Jn.", x: 250, y: 70 },
            { id: "AKW", name: "Ankleshwar", x: 440, y: 70 },
            { id: "BHU", name: "Bharuch Road", x: 630, y: 70 },
            { id: "SUR", name: "Surat", x: 820, y: 70 },
          ].map((station) => (
            <g key={station.id} className="rn-map-station-node">
              <circle cx={station.x} cy={station.y} r="8" fill="#FFFFFF" stroke="#0F2850" strokeWidth="3" />
              <circle cx={station.x} cy={station.y} r="3" fill="#0F2850" />
              <text x={station.x} y={station.y - 20} textAnchor="middle" className="rn-map-stn-code">
                {station.id}
              </text>
              <text x={station.x} y={station.y - 8} textAnchor="middle" className="rn-map-stn-sub">
                {station.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* 4 Section Status Cards Grid */}
      <div className="rn-sections-status-grid">
        {sections.map((sec) => {
          const isSelected = activeSectionId === sec.section_id;
          const statusLower = sec.status.toLowerCase();

          return (
            <div
              key={sec.section_id}
              className={`rn-sec-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectSection(isSelected ? null : sec.section_id)}
              role="button"
              tabIndex={0}
            >
              <div className="rn-sec-header">
                <div className="rn-sec-title-wrap">
                  <span className="rn-sec-code">{sec.name}</span>
                  <span className="rn-sec-km">Km {sec.km_start} – {sec.km_end}</span>
                </div>
                <span className={`rn-status-badge ${statusLower}`}>
                  {sec.status.charAt(0) + sec.status.slice(1).toLowerCase()}
                </span>
              </div>

              <div className="rn-sec-details-list">
                <div className="rn-sec-detail-item">
                  <span className="rn-sec-detail-label">Tracks Available</span>
                  <span className="rn-sec-detail-val">{sec.tracks_available} / {sec.tracks_total}</span>
                </div>
                <div className="rn-sec-detail-item">
                  <span className="rn-sec-detail-label">Active Constraints</span>
                  <span className="rn-sec-detail-val">{sec.active_constraints}</span>
                </div>
                <div className="rn-sec-detail-item">
                  <span className="rn-sec-detail-label">Works Planned</span>
                  <span className="rn-sec-detail-val">{sec.total_works}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
