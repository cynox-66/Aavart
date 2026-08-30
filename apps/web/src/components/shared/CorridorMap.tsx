"use client";

import { SectionInfo } from "@/types";

interface CorridorMapProps {
  sections: SectionInfo[];
  activeSectionId?: string | null;
  incidentSectionId?: string | null;
  incidentLabel?: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  CLEAR: "#16A34A",
  CAUTION: "#F59E0B",
  RESTRICTED: "#EF4444",
};
const UNKNOWN_COLOR = "#94A3B8";

/**
 * Renders whatever real sections a plan actually has, laid out proportionally
 * (using real km spans only if every section reports one). The backend does
 * not currently supply topology/track/status data for sections, so anything
 * missing is drawn as "unknown" rather than an invented value - no fixed
 * station list, no fabricated colors.
 */
export function CorridorMap({ sections, activeSectionId, incidentSectionId, incidentLabel }: CorridorMapProps) {
  if (sections.length === 0) {
    return (
      <div className="rn-corridor-map-wrap rn-corridor-map-empty">
        <p>No section data available for this run.</p>
      </div>
    );
  }

  const hasKm = sections.every((s) => s.km_start != null && s.km_end != null);
  const trackX0 = 60;
  const trackX1 = 820;
  const trackWidth = trackX1 - trackX0;

  const kmMin = hasKm ? Math.min(...sections.map((s) => s.km_start as number)) : 0;
  const kmMax = hasKm ? Math.max(...sections.map((s) => s.km_end as number)) : 0;
  const kmSpan = kmMax - kmMin || 1;

  const segments = sections.map((s, i) => {
    const x0 = hasKm
      ? trackX0 + ((s.km_start as number) - kmMin) / kmSpan * trackWidth
      : trackX0 + (i / sections.length) * trackWidth;
    const x1 = hasKm
      ? trackX0 + ((s.km_end as number) - kmMin) / kmSpan * trackWidth
      : trackX0 + ((i + 1) / sections.length) * trackWidth;
    return { section: s, x0, x1 };
  });

  const hasNodeNames = sections.every((s) => s.from_node && s.to_node);

  return (
    <div className="rn-corridor-map-wrap">
      <svg viewBox="0 0 880 140" className="rn-corridor-map-svg">
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="880" height="140" fill="#F8FAFC" rx="8" />
        <rect x="0" y="0" width="880" height="140" fill="url(#mapGrid)" rx="8" />

        <line x1={trackX0} y1="70" x2={trackX1} y2="70" stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />

        {segments.map(({ section, x0, x1 }) => {
          const isActive = activeSectionId === section.section_id;
          const isIncident = incidentSectionId === section.section_id;
          const color = section.status ? STATUS_COLOR[section.status] ?? UNKNOWN_COLOR : UNKNOWN_COLOR;
          return (
            <g key={section.section_id}>
              <line
                x1={x0}
                y1="70"
                x2={x1}
                y2="70"
                stroke={isIncident ? "#DC2626" : color}
                strokeWidth={isActive || isIncident ? "7" : "4"}
                strokeDasharray={section.status ? undefined : "3 4"}
              />
              <text x={(x0 + x1) / 2} y="95" textAnchor="middle" className="rn-map-stn-sub">
                {section.name || section.section_id}
              </text>
              {isIncident && (
                <text x={(x0 + x1) / 2} y="112" textAnchor="middle" className="rn-map-stn-sub" fill="#DC2626">
                  📍 {incidentLabel ?? "Incident"}
                </text>
              )}
            </g>
          );
        })}

        {hasNodeNames &&
          segments.map(({ section, x0 }, i) => (
            <g key={`node-${section.section_id}`} className="rn-map-station-node">
              <circle cx={x0} cy={70} r="8" fill="#FFFFFF" stroke="#0F2850" strokeWidth="3" />
              <circle cx={x0} cy={70} r="3" fill="#0F2850" />
              <text x={x0} y={70 - 16} textAnchor="middle" className="rn-map-stn-code">
                {section.from_node}
              </text>
              {i === segments.length - 1 && (
                <text x={segments[i].x1} y={70 - 16} textAnchor="middle" className="rn-map-stn-code">
                  {section.to_node}
                </text>
              )}
            </g>
          ))}
      </svg>
    </div>
  );
}
