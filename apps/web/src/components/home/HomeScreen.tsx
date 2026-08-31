"use client";

import { AppView } from "@/types";

interface HomeScreenProps {
  onNavigate: (view: AppView) => void;
  activePlanId?: string;
  hasActivePlan?: boolean;
}

export function HomeScreen({ onNavigate, activePlanId, hasActivePlan = false }: HomeScreenProps) {
  return (
    <div className="rn-home-container">
      <div className="rn-home-card">
        {/* Left Column: Welcome & Value Propositions */}
        <div className="rn-home-left">
          <div className="rn-welcome-header">
            <div className="rn-welcome-icon-box">
              <i aria-hidden="true" className="fi fi-br-train" style={{ color: "#0047BA", fontSize: "36px", display: "flex" }}></i>
            </div>
            <div className="rn-welcome-titles">
              <span className="rn-welcome-pre">Welcome to</span>
              <h1 className="rn-welcome-main">RailNiyojan</h1>
            </div>
          </div>

          <h2 className="rn-welcome-tagline-blue">
            Integrated Block Planning for Indian Railways
          </h2>

          <div className="rn-blue-divider" />

          <p className="rn-welcome-desc">
            Plan maintenance together, reduce disruptions, and keep trains moving.
          </p>

          {/* 3 Value Proposition Cards */}
          <div className="rn-value-props-list">
            <div className="rn-value-prop-card">
              <div className="rn-value-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="rn-value-text">
                <h3>Coordinate maintenance work efficiently</h3>
                <p>Bring Engineering, Signalling and Traction teams together for integrated planning.</p>
              </div>
            </div>

            <div className="rn-value-prop-card">
              <div className="rn-value-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="rn-value-text">
                <h3>Reduce disruptions to train operations</h3>
                <p>Find the best maintenance windows around train movements.</p>
              </div>
            </div>

            <div className="rn-value-prop-card">
              <div className="rn-value-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0047BA" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div className="rn-value-text">
                <h3>Improve safety &amp; reliability</h3>
                <p>Ensure safety constraints while optimizing maintenance and resources.</p>
              </div>
            </div>
          </div>

          <div className="rn-compliance-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span>All planning is done with safety and compliance as the highest priority.</span>
          </div>
        </div>

        {/* Right Column: Train Vector Illustration & Action CTAs */}
        <div className="rn-home-right">
          {/* Train Graphic */}
          <div className="rn-train-illustration-container">
            <svg viewBox="0 0 540 230" className="rn-train-svg" fill="none" stroke="#94A3B8">
              {/* Background scenic contours */}
              <path d="M 0 170 C 120 160, 240 180, 540 170" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 400 170 Q 425 120 450 170 Q 475 120 500 170 Q 525 120 540 170" stroke="#E2E8F0" strokeWidth="1" />
              
              {/* Signals */}
              <line x1="480" y1="90" x2="480" y2="185" stroke="#64748B" strokeWidth="2.5" />
              <rect x="474" y="90" width="12" height="32" rx="6" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
              <circle cx="480" cy="98" r="2.5" fill="#22C55E" />
              <circle cx="480" cy="106" r="2.5" fill="#F59E0B" />
              <circle cx="480" cy="114" r="2.5" fill="#EF4444" />
              
              {/* Catenary Mast & Wires */}
              <line x1="160" y1="70" x2="160" y2="185" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="150" y1="70" x2="280" y2="70" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="320" y1="70" x2="320" y2="185" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="310" y1="70" x2="450" y2="70" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M 0 85 Q 160 95 320 85 Q 450 95 540 85" stroke="#94A3B8" strokeWidth="1" />
              <path d="M 0 100 L 540 100" stroke="#94A3B8" strokeWidth="1" />

              {/* Railway Tracks (Perspective) */}
              <line x1="0" y1="185" x2="540" y2="185" stroke="#0047BA" strokeWidth="2.5" />
              <line x1="0" y1="198" x2="540" y2="198" stroke="#0047BA" strokeWidth="3" />
              {/* Sleepers */}
              {[40, 90, 140, 190, 240, 290, 340, 390, 440, 490].map((x) => (
                <line key={x} x1={x - 8} y1="180" x2={x + 10} y2="204" stroke="#64748B" strokeWidth="2" />
              ))}

              {/* Modern Bullet / Vande Bharat Train */}
              <g transform="translate(180, 75)">
                {/* Pantograph */}
                <path d="M 120 25 L 140 5 L 160 25" stroke="#0047BA" strokeWidth="2" fill="none" />
                <line x1="130" y1="5" x2="150" y2="5" stroke="#0047BA" strokeWidth="2" />

                {/* Train Body */}
                <path
                  d="M 60 110 L 290 110 L 290 55 L 90 55 Q 40 55 10 90 Q 0 105 0 110 Z"
                  fill="#FFFFFF"
                  stroke="#0047BA"
                  strokeWidth="2"
                />
                {/* Aerodynamic Nose Line */}
                <path d="M 10 90 Q 30 75 75 75 L 290 75" stroke="#0047BA" strokeWidth="1.5" fill="none" />
                
                {/* Windshield */}
                <path d="M 15 85 Q 35 62 60 62 L 65 85 Z" fill="#E2E8F0" stroke="#0047BA" strokeWidth="1.5" />
                
                {/* Passenger Windows */}
                {[90, 125, 160, 195, 230, 265].map((wx) => (
                  <rect key={wx} x={wx} y="62" width="24" height="20" rx="3" fill="#E2E8F0" stroke="#0047BA" strokeWidth="1" />
                ))}

                {/* Blue Stripe */}
                <path d="M 0 100 L 290 100" stroke="#0047BA" strokeWidth="4" />

                {/* Headlights */}
                <ellipse cx="25" cy="100" rx="4" ry="2.5" fill="#F59E0B" />
                <ellipse cx="50" cy="100" rx="4" ry="2.5" fill="#F59E0B" />

                {/* Train Bogies / Wheels */}
                <rect x="70" y="110" width="40" height="6" rx="2" fill="#64748B" />
                <rect x="230" y="110" width="40" height="6" rx="2" fill="#64748B" />
              </g>
            </svg>
          </div>

          {/* Action CTAs */}
          <div className="rn-home-action-cards">
            {/* Start New Plan - Primary Blue Card */}
            <button
              type="button"
              className="rn-action-card rn-action-primary"
              onClick={() => onNavigate("wizard-step-1")}
            >
              <div className="rn-action-icon-box primary">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>

              <div className="rn-action-details">
                <h3>Start New Plan</h3>
                <p>
                  {hasActivePlan && activePlanId
                    ? `Replaces the active plan (${activePlanId}) with a new planning session.`
                    : "Create a new planning session for your corridor and planning period."}
                </p>
              </div>

              <div className="rn-action-arrow-btn primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>

            {/* View Previous Plans - White Card */}
            <button
              type="button"
              className="rn-action-card rn-action-secondary"
              onClick={() => onNavigate("previous-plans")}
            >
              <div className="rn-action-icon-box secondary">
                <i aria-hidden="true" className="fi fi-br-time-past" style={{ color: "#0047BA", fontSize: "26px", display: "flex" }}></i>
              </div>

              <div className="rn-action-details">
                <h3>View Previous Plans</h3>
                <p>Access and review your past planning sessions and exported plans.</p>
              </div>

              <div className="rn-action-arrow-btn secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>

            {/* Rapid-Block Review - Red Card, disabled until a plan exists */}
            <button
              type="button"
              className={`rn-action-card rn-action-emergency ${!hasActivePlan ? "disabled" : ""}`}
              onClick={() => onNavigate("rapid-block")}
              disabled={!hasActivePlan}
              title={hasActivePlan ? undefined : "Create a plan first — Rapid Block adds an incident to an active run."}
            >
              <div className="rn-action-icon-box">
                <i aria-hidden="true" className="fi fi-br-problem-solving" style={{ color: "#EF4444", fontSize: "26px", display: "flex" }}></i>
              </div>

              <div className="rn-action-details">
                <h3>Rapid-Block Review</h3>
                <p>
                  {hasActivePlan && activePlanId
                    ? `Add an urgent incident to ${activePlanId} and re-optimize around it.`
                    : "Create a plan first — this adds an urgent incident to an active run."}
                </p>
              </div>

              <div className="rn-action-arrow-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
