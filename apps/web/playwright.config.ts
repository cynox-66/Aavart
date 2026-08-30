import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = process.env.PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

const apiPort = process.env.API_PORT ?? "8000";
const apiURL = process.env.NEXT_PUBLIC_API_URL ?? `http://127.0.0.1:${apiPort}`;

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const backendSrc = fileURLToPath(new URL("../../backend/src", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Every spec below the first drives the real backend, so the suite owns both
  // processes. Starting only the web server made the suite pass on a machine
  // that happened to have the API running and fail in CI, where nothing does.
  webServer: [
    {
      command: `uv run --project backend uvicorn railniyojan.api.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: repoRoot,
      // The backend is installed as an editable package, but pytest already
      // leans on `pythonpath = ["src"]` rather than that install. Do the same
      // here so the suite does not depend on the editable hook resolving.
      env: { PYTHONPATH: backendSrc },
      url: `${apiURL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // uvicorn logs startup failures and tracebacks to stderr; the access log
      // on stdout is noise once the suite is green.
      stderr: "pipe",
    },
    {
      command: `pnpm dev --hostname 127.0.0.1 --port ${port}`,
      env: { NEXT_PUBLIC_API_URL: apiURL },
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
