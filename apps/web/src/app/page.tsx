import { HealthCheck } from "@/app/health-check";
import { PlannerDashboard } from "@/app/planner-dashboard";

export default function Home() {
  return (
    <main className="shell">
      <header className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Aavart / SIH26027 / Backend-led planning</p>
          <h1>
            Rail<span>Niyojan</span>
          </h1>
          <p className="lede">
            Open on the live planning desk. The old intro shell has been removed so the dashboard is
            the first thing you see.
          </p>
          <HealthCheck />
        </div>
      </header>

      <PlannerDashboard />

      <footer>
        Synthetic data. Demonstration ruleset. Human approval required. Not for operational
        sanctioning.
      </footer>
    </main>
  );
}
