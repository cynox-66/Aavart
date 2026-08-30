"use client";

import { useMemo, useState } from "react";
import { mockPreviousPlans } from "@/lib/mock-data";

interface PreviousPlansListProps {
  onSelectPlan: (runId: string) => void;
  onBackToHome: () => void;
}

type SortKey = "date" | "tasksCount" | "runId";

export function PreviousPlansList({ onSelectPlan, onBackToHome }: PreviousPlansListProps) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<"ALL" | "OPTIMAL" | "FEASIBLE">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = mockPreviousPlans.filter((p) => {
      if (stateFilter !== "ALL" && p.state !== stateFilter) return false;
      if (!q) return true;
      return (
        p.runId.toLowerCase().includes(q) ||
        p.snapshotId.toLowerCase().includes(q) ||
        (p.approvedBy ?? "").toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "tasksCount") cmp = a.tasksCount - b.tasksCount;
      else cmp = a.runId.localeCompare(b.runId);
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [query, stateFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortAsc ? " ▲" : " ▼") : "");

  return (
    <div className="previous-plans-layout">
      <div className="planning-step-header">
        <div>
          <span className="step-kicker">ARCHIVE &amp; AUDIT TRAIL</span>
          <h2>Past Corridor Planning Runs</h2>
          <p className="step-desc">
            Historical approved weekly maintenance schedules with full solver lineage and reason code logs.
          </p>
        </div>

        <button type="button" className="btn-back-home-top" onClick={onBackToHome}>
          ← Back to Home
        </button>
      </div>

      <div className="demo-data-banner">
        ⚠️ Demo data — the backend has no endpoint to list past runs yet, so the rows below are
        illustrative and not sourced from the live system.
      </div>

      {/* Filter / search toolbar */}
      <div className="plans-toolbar">
        <div className="plans-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <label htmlFor="plans-search-input" className="sr-only-label">Search past plans</label>
          <input
            id="plans-search-input"
            className="plans-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search run ID, snapshot, or reviewer…"
          />
          {query && (
            <button type="button" className="plans-clear-btn" onClick={() => setQuery("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="plans-state-filter" role="group" aria-label="Filter by solver state">
          {(["ALL", "OPTIMAL", "FEASIBLE"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`btn-filter-pill ${stateFilter === s ? "active" : ""}`}
              onClick={() => setStateFilter(s)}
              aria-pressed={stateFilter === s}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="plans-result-count">
          {rows.length} of {mockPreviousPlans.length} run{mockPreviousPlans.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="previous-plans-card">
        {rows.length === 0 ? (
          <div className="rn-empty-state">
            <strong>No matching runs</strong>
            <p>
              Nothing matches {query ? `“${query}”` : "this filter"}
              {stateFilter !== "ALL" ? ` in state ${stateFilter}` : ""}. Try clearing the filters.
            </p>
            <button
              type="button"
              className="btn-back-home-top"
              onClick={() => {
                setQuery("");
                setStateFilter("ALL");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table className="previous-plans-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort-btn" onClick={() => toggleSort("runId")}>
                    Plan / Run ID{sortIndicator("runId")}
                  </button>
                </th>
                <th>Snapshot Reference</th>
                <th>
                  <button type="button" className="th-sort-btn" onClick={() => toggleSort("date")}>
                    Planning Date{sortIndicator("date")}
                  </button>
                </th>
                <th>Solver State</th>
                <th>Authorized Reviewer</th>
                <th>
                  <button type="button" className="th-sort-btn" onClick={() => toggleSort("tasksCount")}>
                    Task Count{sortIndicator("tasksCount")}
                  </button>
                </th>
                <th>Downtime Gain</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((plan) => (
                <tr key={plan.runId} className="plan-archive-row">
                  <td><strong className="mono-run-id">{plan.runId}</strong></td>
                  <td><span className="mono-snap-id">{plan.snapshotId}</span></td>
                  <td>{plan.date}</td>
                  <td><span className="state-badge-optimal">{plan.state}</span></td>
                  <td>{plan.approvedBy ?? "—"}</td>
                  <td><strong>{plan.tasksCount} Jobs</strong></td>
                  <td className="gain-cell"><strong>{plan.downtimeSaved}</strong></td>
                  <td>
                    <button
                      type="button"
                      className="btn-open-plan-archive"
                      onClick={() => onSelectPlan(plan.runId)}
                      title={`Open ${plan.runId} in read-only review mode`}
                    >
                      Open Review Desk →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
