import { HealthCheck } from "@/app/health-check";
import { PlannerDashboard } from "@/app/planner-dashboard";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="signal-line" aria-hidden="true" />
        <p className="eyebrow">Aavart / SIH26027</p>
        <h1>
          Rail<span>Niyojan</span>
        </h1>
        <p className="lede">
          Deterministic maintenance planning with explicit conflicts, preserved locks, independent
          validation, and human-gated export.
        </p>
        <HealthCheck />
      </section>

      <PlannerDashboard />

      <footer>
        Synthetic data. Demonstration ruleset. Human approval required. Not for operational
        sanctioning.
      </footer>
    </main>
  );
}
