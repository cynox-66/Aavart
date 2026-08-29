import { HealthCheck } from "@/app/health-check";
import { PlannerDashboard } from "@/app/planner-dashboard";

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Aavart / SIH26027 / Backend-led planning</p>
          <h1>
            Rail<span>Niyojan</span>
          </h1>
          <p className="lede">
            Corridor truth, weekly windows, reason-coded jobs, preserved locks, independent
            validation, and human-gated export.
          </p>
          <HealthCheck />
        </div>
        <div className="atlas-preview" aria-hidden="true">
          <svg viewBox="0 0 900 460">
            <path className="preview-track" d="M-20 120 L210 160 L360 130 L550 205 L930 190" />
            <path className="preview-track" d="M70 430 L240 280 L430 250 L590 100 L760 -20" />
            <path className="preview-track" d="M120 -20 L230 120 L250 290 L390 420" />
            <path className="preview-route" d="M-20 120 L210 160 L360 130 L550 205 L930 190" />
            <path className="preview-route" d="M70 430 L240 280 L430 250 L590 100 L760 -20" />
            <circle className="preview-stop" cx="210" cy="160" r="12" />
            <circle className="preview-stop" cx="360" cy="130" r="12" />
            <circle className="preview-stop" cx="550" cy="205" r="12" />
            <circle className="preview-stop" cx="240" cy="280" r="12" />
            <circle className="preview-stop" cx="430" cy="250" r="12" />
            <circle className="preview-stop" cx="590" cy="100" r="12" />
          </svg>
        </div>
      </section>

      <PlannerDashboard />

      <footer>
        Synthetic data. Demonstration ruleset. Human approval required. Not for operational
        sanctioning.
      </footer>
    </main>
  );
}
