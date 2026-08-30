"use client";

import { useState } from "react";
import { getLiveTrain, type LiveTrainData } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

/**
 * Live public train status from RailRadar, proxied through our backend.
 *
 * This is decision *context* for the planner deciding an emergency block —
 * it is never fed into the optimizer, and the backend does not correlate it
 * with the plan. Labelled as such so it can't be mistaken for a plan input.
 */
export function LiveTrainLookup() {
  const [trainNumber, setTrainNumber] = useState("");
  const [data, setData] = useState<LiveTrainData | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /^\d{5}$/.test(trainNumber);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getLiveTrain(trainNumber);
      setData(res.data);
      setFetchedAt(res.fetched_at);
    } catch (err) {
      setData(null);
      setError(errorMessage(err) || "Live train lookup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const delay = data?.currentLocation?.delayMinutes ?? data?.delayMinutes ?? 0;

  return (
    <div className="live-train-card">
      <div className="live-train-head">
        <div>
          <span className="emergency-kicker live">Live Train Status</span>
          <h3>Check a train before blocking</h3>
        </div>
        <span className="live-source-tag" title="Public data via RailRadar, proxied and cached by the backend">
          RailRadar · live
        </span>
      </div>

      <form className="live-train-form" onSubmit={lookup}>
        <label htmlFor="train-number" className="sr-only-label">Train number</label>
        <input
          id="train-number"
          className="live-train-input"
          value={trainNumber}
          onChange={(e) => setTrainNumber(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="5-digit train no. (e.g. 12952)"
          inputMode="numeric"
          disabled={isLoading}
          aria-describedby="train-number-hint"
        />
        <button type="submit" className="live-train-btn" disabled={!isValid || isLoading}>
          {isLoading ? <span className="spinner-inline dark" aria-hidden="true" /> : "Check"}
        </button>
      </form>

      {!data && !error && (
        <p className="live-train-hint" id="train-number-hint">
          Optional context only — live running status is never used as a planning input.
        </p>
      )}

      {error && <p className="live-train-error" role="alert">{error}</p>}

      {data && (
        <div className="live-train-result">
          <div className="live-train-title">
            <strong>{data.trainNumber}</strong>
            <span>{data.trainName}</span>
          </div>

          <div className="live-train-rows">
            <div className="live-train-row">
              <span>Status</span>
              <strong className={data.isLive ? "live-ok" : ""}>
                {data.status}{data.isLive ? " · live" : ""}
              </strong>
            </div>
            <div className="live-train-row">
              <span>Delay</span>
              <strong className={delay > 15 ? "live-bad" : delay > 0 ? "live-warn" : "live-ok"}>
                {delay > 0 ? `+${delay} min` : "On time"}
              </strong>
            </div>
            {data.currentLocation && (
              <div className="live-train-row">
                <span>Position</span>
                <strong>
                  {data.currentLocation.stationName?.trim() ||
                    data.currentLocation.stationCode ||
                    "Unknown"}
                  {data.currentLocation.status ? ` · ${data.currentLocation.status}` : ""}
                </strong>
              </div>
            )}
            <div className="live-train-row">
              <span>Route</span>
              <strong>{data.train.source.code} → {data.train.destination.code}</strong>
            </div>
          </div>

          {fetchedAt && (
            <p className="live-train-hint">
              Fetched {new Date(fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              {" · "}public RailRadar data, not correlated with this plan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
