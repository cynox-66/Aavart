"use client";

import { useState } from "react";
import { RapidBlockFormValues } from "@/types";

interface EmergencyIncidentFormProps {
  isBusy: boolean;
  onSubmit: (values: RapidBlockFormValues) => Promise<void>;
  onExit: () => void;
}

export function EmergencyIncidentForm({
  isBusy,
  onSubmit,
  onExit,
}: EmergencyIncidentFormProps) {
  const [incidentType, setIncidentType] = useState("Rail Fracture (TMS)");
  const [sectionId, setSectionId] = useState("ST-03");
  const [durationHours, setDurationHours] = useState(4);
  const [notes, setNotes] = useState(
    "Emergency ultrasonic detection revealed rail web fracture at Km 512/4. Immediate 4-hour track clamp and renewal required.",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType || !sectionId || durationHours <= 0 || isBusy) return;
    await onSubmit({
      incidentType,
      sectionId,
      durationMinutes: durationHours * 60,
      notes,
    });
  };

  return (
    <form className="emergency-incident-form-card" onSubmit={handleSubmit}>
      <div className="incident-form-header">
        <span className="emergency-kicker">INCIDENT INGESTION</span>
        <h3>Report Emergency Defect</h3>
        <p>
          Inject an unplanned track, signal, or OHE breakdown into the live corridor schedule.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="incident-type">Incident Type / Department Channel</label>
        <select
          id="incident-type"
          className="form-select"
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
          disabled={isBusy}
        >
          <option value="Rail Fracture (TMS)">Rail Fracture (Track / TMS) — High Criticality</option>
          <option value="Point Machine Failure (SMMS)">Point Machine Failure (Signal / SMMS)</option>
          <option value="25kV OHE Contact Wire Snap (TDMS)">25kV OHE Contact Wire Snap (Traction / TDMS)</option>
          <option value="Track Buckling Hazard (TMS)">Track Buckling Hazard (Track / TMS)</option>
          <option value="Signal Interlocking Dropout (SMMS)">Signal Interlocking Dropout (Signal / SMMS)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="section-id">Corridor Section / Location</label>
        <select
          id="section-id"
          className="form-select"
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          disabled={isBusy}
        >
          <option value="ST-01">ST-01: BRC – VDA (Km 0 – 52)</option>
          <option value="ST-02">ST-02: VDA – AKW (Km 52 – 146)</option>
          <option value="ST-03">ST-03: AKW – BHU (Km 146 – 198) — Mainline</option>
          <option value="ST-04">ST-04: BHU – SUR (Km 198 – 256)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="duration-hours">Required Possession Window</label>
        <div className="duration-pill-selector">
          {[1, 2, 4, 6, 8].map((hrs) => (
            <button
              key={hrs}
              type="button"
              className={`btn-duration-pill ${durationHours === hrs ? "active" : ""}`}
              onClick={() => setDurationHours(hrs)}
              disabled={isBusy}
            >
              {hrs} {hrs === 1 ? "Hour" : "Hours"}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="incident-notes">Operational Justification & Field Notes</label>
        <textarea
          id="incident-notes"
          rows={3}
          className="form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter field officer reports..."
          disabled={isBusy}
        />
      </div>

      <div className="incident-form-actions">
        <button
          type="button"
          className="btn-exit-emergency"
          onClick={onExit}
          disabled={isBusy}
        >
          ← Exit to Overview
        </button>

        <button
          type="submit"
          className="btn-inject-reoptimize"
          disabled={isBusy}
        >
          {isBusy ? (
            <>
              <span className="spinner-inline" /> Calculating Impact...
            </>
          ) : (
            <>⚙️ Inject & Re-Optimize Plan</>
          )}
        </button>
      </div>
    </form>
  );
}
