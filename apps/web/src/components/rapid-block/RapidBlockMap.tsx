"use client";

import { RapidBlockImpactView } from "@/types";

interface RapidBlockMapProps {
  impact: RapidBlockImpactView | null;
  selectedSectionId: string;
}

export function RapidBlockMap({ impact, selectedSectionId }: RapidBlockMapProps) {
  const activeSection = impact?.incidentLocation.sectionId || selectedSectionId;

  return (
    <div className="rapid-block-map-card">
      <div className="map-card-topline">
        <div>
          <span className="emergency-kicker">LIVE BLAST RADIUS MONITOR</span>
          <h3>Corridor Dynamic Restriction Map</h3>
        </div>

        <div className="live-pulse-badge">
          <span className="pulse-dot-red" />
          <span>REAL-TIME TRAFFIC RESTRICTION</span>
        </div>
      </div>

      <div className="rapid-map-canvas">
        <svg viewBox="0 0 780 160" className="rapid-map-svg" role="img" aria-label="Emergency Blast Radius Map">
          {/* Main Corridor Line */}
          <line x1="50" y1="80" x2="730" y2="80" stroke="#252825" strokeWidth="12" strokeLinecap="round" />

          {/* Normal Sections */}
          <line x1="50" y1="80" x2="220" y2="80" stroke="#5ca978" strokeWidth="4" />
          <line x1="220" y1="80" x2="390" y2="80" stroke="#e4a041" strokeWidth="4" />
          <line x1="560" y1="80" x2="730" y2="80" stroke="#5ca978" strokeWidth="4" />

          {/* Emergency Blast Section (ST-03: 390 -> 560) */}
          <rect
            x="380"
            y="50"
            width="190"
            height="60"
            fill="rgba(200, 93, 79, 0.25)"
            stroke="#c85d4f"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            rx="8"
            className="blast-zone-pulsating-box"
          />

          <line x1="390" y1="80" x2="560" y2="80" stroke="#c85d4f" strokeWidth="8" />

          {/* Pulsating Blast Center Circle */}
          <circle cx="475" cy="80" r="28" fill="rgba(200, 93, 79, 0.3)" className="blast-ripple-outer" />
          <circle cx="475" cy="80" r="14" fill="#c85d4f" />
          <circle cx="475" cy="80" r="4" fill="#fff" />

          {/* Incident Pin Tag */}
          <g transform="translate(415, 20)">
            <rect x="0" y="0" width="120" height="22" rx="4" fill="#c85d4f" />
            <text x="60" y="15" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
              📍 RAIL FRACTURE Km 512
            </text>
          </g>

          {/* Stations */}
          {[
            { id: "BRC", km: "Km 0", x: 50 },
            { id: "VDA", km: "Km 52", x: 220 },
            { id: "AKW", km: "Km 146", x: 390 },
            { id: "BHU", km: "Km 198", x: 560 },
            { id: "SUR", km: "Km 256", x: 730 },
          ].map((st) => (
            <g key={st.id}>
              <circle cx={st.x} cy="80" r="10" fill="#131413" stroke="#e4a041" strokeWidth="2" />
              <text x={st.x} y="60" textAnchor="middle" fill="#f3ead8" fontSize="11" fontWeight="bold">
                {st.id}
              </text>
              <text x={st.x} y="108" textAnchor="middle" fill="#a79f91" fontSize="9">
                {st.km}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="rapid-map-meta">
        <div className="meta-sec-badge">
          <span>Active Defect Section:</span>
          <strong>{activeSection} (AKW – BHU, Mainline Up/Down)</strong>
        </div>
        <span className="blast-radius-label">
          ⚠️ Dynamic speed restriction (15 km/h) enforced on adjacent track
        </span>
      </div>
    </div>
  );
}
