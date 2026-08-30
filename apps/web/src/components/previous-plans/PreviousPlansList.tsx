"use client";

import { mockPreviousPlans } from "@/lib/mock-data";

interface PreviousPlansListProps {
  onSelectPlan: (runId: string) => void;
  onBackToHome: () => void;
}

export function PreviousPlansList({ onSelectPlan, onBackToHome }: PreviousPlansListProps) {
  return (
    <div className="previous-plans-layout">
      <div className="planning-step-header">
        <div>
          <span className="step-kicker">ARCHIVE & AUDIT TRAIL</span>
          <h2>Past Corridor Planning Runs</h2>
          <p className="step-desc">
            Historical approved weekly maintenance schedules with full solver lineage and reason code logs.
          </p>
        </div>

        <button type="button" className="btn-back-home-top" onClick={onBackToHome}>
          ← Back to Home
        </button>
      </div>

      <div className="previous-plans-card">
        <table className="previous-plans-table">
          <thead>
            <tr>
              <th>Plan / Run ID</th>
              <th>Snapshot Reference</th>
              <th>Planning Date</th>
              <th>Solver State</th>
              <th>Authorized Reviewer</th>
              <th>Task Count</th>
              <th>Downtime Gain</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockPreviousPlans.map((plan) => (
              <tr key={plan.runId} className="plan-archive-row">
                <td>
                  <strong className="mono-run-id">{plan.runId}</strong>
                </td>
                <td>
                  <span className="mono-snap-id">{plan.snapshotId}</span>
                </td>
                <td>{plan.date}</td>
                <td>
                  <span className="state-badge-optimal">{plan.state}</span>
                </td>
                <td>{plan.approvedBy || "Arnav Pathak"}</td>
                <td>
                  <strong>{plan.tasksCount} Jobs</strong>
                </td>
                <td className="gain-cell">
                  <strong>{plan.downtimeSaved}</strong>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-open-plan-archive"
                    onClick={() => onSelectPlan(plan.runId)}
                    title="Open plan in Review Mode (Read-Only)"
                  >
                    Open Review Desk →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
