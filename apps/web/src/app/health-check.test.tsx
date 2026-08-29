import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { HealthCheck } from "@/app/health-check";

afterEach(() => {
  vi.restoreAllMocks();
});

test("shows API online after a successful health response", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ status: "ok", service: "railniyojan-api" }), {
      status: 200,
    }),
  );

  render(<HealthCheck />);

  expect(await screen.findByText("API online")).toBeInTheDocument();
});

