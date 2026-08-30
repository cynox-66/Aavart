"use client";

import { useState } from "react";
import { RapidBlockFormValues, SectionInfo } from "@/types";

interface EmergencyIncidentFormProps {
  sections: SectionInfo[];
  isBusy: boolean;
  onSubmit: (values: RapidBlockFormValues) => Promise<void>;
  onExit: () => void;
}

const INCIDENT_TYPES = [
  { value: "Rail Fracture (TMS)", label: "Rail Fracture (Track / TMS)", hint: "High criticality" },
  { value: "Track Buckling Hazard (TMS)", label: "Track Buckling Hazard (Track / TMS)", hint: "High criticality" },
  { value: "Point Machine Failure (SMMS)", label: "Point Machine Failure (Signal / SMMS)", hint: "" },
  { value: "Signal Interlocking Dropout (SMMS)", label: "Signal Interlocking Dropout (Signal / SMMS)", hint: "" },
  { value: "25kV OHE Contact Wire Snap (TDMS)", label: "25kV OHE Contact Wire Snap (Traction / TDMS)", hint: "" },
];

const DURATIONS = [1, 2, 4, 6, 8];

export function EmergencyIncidentForm({
  sections,
  isBusy,
  onSubmit,
  onExit,
}: EmergencyIncidentFormProps) {
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0].value);
  const [sectionId, setSectionId] = useState(sections[0]?.section_id ?? "");
  const [durationHours, setDurationHours] = useState(4);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const sectionError = !sectionId ? "Select the affected corridor section." : null;
  const canSubmit = !sectionError && !isBusy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit({
      incidentType,
      sectionId,
      durationMinutes: durationHours * 60,
      notes,
    });
  };

  return (
    <form className="emergency-incident-form-card" onSubmit={handleSubmit} noValidate>
      <div className="incident-form-header">
        <span className="emergency-kicker">1. Incident Details</span>
        <h3>Report Incident</h3>
        <p>Add an unplanned track, signal, or OHE incident to the active corridor plan.</p>
      </div>

      <div className="form-group">
        <label htmlFor="incident-type">Incident Type</label>
        <select
          id="incident-type"
          className="form-select"
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
          disabled={isBusy}
        >
          {INCIDENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}{t.hint ? ` — ${t.hint}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="section-id">Section / Location</label>
        <select
          id="section-id"
          className={`form-select ${touched && sectionError ? "has-error" : ""}`}
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          disabled={isBusy || sections.length === 0}
          aria-invalid={Boolean(touched && sectionError)}
          aria-describedby={touched && sectionError ? "section-error" : undefined}
        >
          {sections.length === 0 && <option value="">No sections in the active plan</option>}
          {sections.map((s) => (
            <option key={s.section_id} value={s.section_id}>
              {s.section_id}
              {s.from_node && s.to_node ? ` (${s.from_node} – ${s.to_node})` : ""}
              {` · ${s.total_works} works planned`}
            </option>
          ))}
        </select>
        {touched && sectionError && (
          <span className="form-error" id="section-error" role="alert">{sectionError}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="duration-hours">Estimated Duration</label>
        <select
          id="duration-hours"
          className="form-select"
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          disabled={isBusy}
        >
          {DURATIONS.map((hrs) => (
            <option key={hrs} value={hrs}>{hrs} {hrs === 1 ? "Hour" : "Hours"}</option>
          ))}
        </select>
        <span className="form-hint">Block duration requested for this incident review.</span>
      </div>

      <div className="form-group">
        <label htmlFor="incident-notes">Notes (Optional)</label>
        <textarea
          id="incident-notes"
          rows={3}
          className="form-textarea"
          value={notes}
          maxLength={400}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Rail snapped at km 512, ultrasonic detection confirmed."
          disabled={isBusy}
        />
        <span className="form-hint">{notes.length} / 400 — recorded as the audit justification.</span>
      </div>

      <div className="incident-form-actions">
        <button type="button" className="btn-exit-emergency" onClick={onExit} disabled={isBusy}>
          Cancel
        </button>

        <button type="submit" className="btn-inject-reoptimize" disabled={!canSubmit}>
          {isBusy ? (
            <>
              <span className="spinner-inline" aria-hidden="true" /> Calculating impact…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10.6 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09A1.65 1.65 0 0 0 21 10.6h.09a2 2 0 1 1 0 4H21a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Submit Incident &amp; Re-Optimize Plan
            </>
          )}
        </button>
      </div>
    </form>
  );
}
