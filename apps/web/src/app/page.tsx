import { HealthCheck } from "@/app/health-check";

const foundationItems = [
  ["Contract", "Pydantic models + OpenAPI"],
  ["Data", "Deterministic baseline fixture"],
  ["Safety", "Validation before planning"],
  ["Scope", "One corridor / one week"],
];

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
          The shared development foundation is active. This shell exposes backend truth; it does
          not simulate planning results.
        </p>
        <HealthCheck />
      </section>

      <section className="foundation" aria-labelledby="foundation-title">
        <div>
          <p className="section-number">01</p>
          <h2 id="foundation-title">Foundation boundary</h2>
        </div>
        <div className="foundation-grid">
          {foundationItems.map(([label, value]) => (
            <article key={label}>
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <footer>
        Synthetic data. Demonstration ruleset. Human approval required. Not for operational
        sanctioning.
      </footer>
    </main>
  );
}

