"use client";

import { useEffect, useState } from "react";

import { getApiHealth } from "@/lib/api";

type HealthState = "checking" | "online" | "offline";

export function HealthCheck() {
  const [state, setState] = useState<HealthState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    getApiHealth(controller.signal)
      .then(() => setState("online"))
      .catch(() => {
        if (!controller.signal.aborted) setState("offline");
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="health" data-state={state} role="status">
      <span aria-hidden="true" />
      API {state}
    </div>
  );
}

