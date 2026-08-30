import { expect, test, type Page } from "@playwright/test";

/**
 * Gap 9, front end half. The backend fix is not enough on its own: the adapter
 * used to recompute the headline percentage from the minute totals, so the screen
 * had its own source of truth and a backend correction would not have reached it.
 * These tests drive the real solver and assert on what the operator actually sees.
 */

async function reachReviewScreen(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Start New Plan/ }).click();
  await page.getByRole("radio", { name: /Baseline Test Corridor/ }).click();
  await page.getByRole("button", { name: "Check Data →" }).click();
  await expect(page.getByText("Backend hash")).toBeVisible();
  await page.getByRole("button", { name: /3\. Create Plan/ }).click();
  await expect(page.getByText("Plan Quality")).toBeVisible({ timeout: 15_000 });
}

test("the reduction is never shown without coverage beside it", async ({ page }) => {
  await reachReviewScreen(page);

  const impact = page.locator(".rn-plan-impact-card");
  await expect(impact).toContainText("Section Closure Time");
  await expect(impact).toContainText("Work Covered");

  // The baseline fixture schedules 3 of its 4 jobs.
  await expect(impact).toContainText("3 of 4 jobs");
  await expect(impact.getByText("75.0%")).toBeVisible();
});

test("the headline names its counterfactual instead of implying a human plan", async ({ page }) => {
  await reachReviewScreen(page);

  const impact = page.locator(".rn-plan-impact-card");
  // Each tile states the counterfactual next to the figure, with both totals.
  await expect(impact).toContainText("one possession per job");
  await expect(impact).toContainText(/\d+h( \d+m)? vs\. \d+h( \d+m)? one possession per job/);
  // The old copy claimed a baseline the system never had.
  await expect(page.getByText("vs. baseline (unoptimized) plan")).toHaveCount(0);
  await expect(page.getByText("vs. baseline", { exact: true })).toHaveCount(0);
});

test("the screen shows the backend's number, not one it recomputed", async ({ page }) => {
  // POST /planning-runs returns only the created stub; the KPIs arrive on the
  // detail GET the app makes next.
  let apiPercent: number | null = null;
  page.on("response", async (response) => {
    if (!response.url().includes("/planning-runs/") || response.request().method() !== "GET") return;
    const body = await response.json().catch(() => null);
    if (body?.kpis) apiPercent = body.kpis.closure_reduction_percent as number;
  });

  await reachReviewScreen(page);
  expect(apiPercent).not.toBeNull();

  // The baseline fixture co-locates nothing, so the honest figure is 0.0%. The
  // adapter's old derivation produced the same 0 here only by coincidence; what
  // matters is that the rendered value tracks the API's field exactly.
  const rendered = `${apiPercent! > 0 ? "-" : ""}${apiPercent!.toFixed(1)}%`;
  await expect(page.locator(".rn-plan-impact-card")).toContainText(rendered);
});

test("the comparison modal labels the baseline as serial, not as a plan", async ({ page }) => {
  await reachReviewScreen(page);

  await page.getByRole("button", { name: /View Detailed Comparison/ }).click();
  const modal = page.locator(".comparison-table-wrapper");

  await expect(modal).toContainText("Serial baseline");
  await expect(modal).toContainText("Asset Downtime");
  await expect(modal).toContainText("Total Section Closures");
});

test("approval surfaces unscheduled work rather than only the reduction", async ({ page }) => {
  await reachReviewScreen(page);
  await page.getByRole("button", { name: /Approve Plan/ }).first().click();

  // One of the four baseline jobs is rejected for a train path conflict; the
  // reviewer must be told before approving, not after.
  await expect(page.getByText(/1 of 4 jobs unscheduled \(2h of work\)/)).toBeVisible();
});
