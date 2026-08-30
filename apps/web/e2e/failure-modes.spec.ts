import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Gap 5, the failure space. Every test here drives the app into a state the
 * happy path never reaches: a backend that 500s, a solver that returns
 * INFEASIBLE or TIMEOUT, a guard the operator tries to walk past.
 *
 * Backend responses are stubbed with page.route() because INFEASIBLE, TIMEOUT
 * and 500 are not reachable through the real API without adding a test-only
 * mode to it. foundation.spec.ts keeps one unstubbed full-stack path so these
 * stubs cannot silently drift from the real contract.
 */

async function startPlan(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Start New Plan/ }).click();
  await page.getByRole("radio", { name: /Baseline Test Corridor/ }).click();
}

async function reachReview(page: Page) {
  await startPlan(page);
  await page.getByRole("button", { name: "Check Data →" }).click();
  await expect(page.getByText("Backend hash")).toBeVisible();
  await page.getByRole("button", { name: /3\. Create Plan/ }).click();
  await expect(page.getByText("Plan Quality")).toBeVisible({ timeout: 15_000 });
}

/** Rewrites the run detail the app reads back after creating a run. */
async function stubRunState(page: Page, mutate: (body: Record<string, unknown>) => void) {
  await page.route("**/planning-runs/*", async (route: Route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    const body = (await response.json()) as Record<string, unknown>;
    mutate(body);
    await route.fulfill({ response, json: body });
  });
}

// ---------------------------------------------------------------- ingestion

test("a malformed upload is named as an error and never becomes a dataset", async ({ page }) => {
  await startPlan(page);
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{ this is not json"),
  });

  await expect(page.locator(".toast-card").filter({ hasText: /Failed|Error/i })).toBeVisible();
});

test("an empty upload is rejected rather than validated as zero jobs", async ({ page }) => {
  await startPlan(page);
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from(""),
  });

  await expect(page.locator(".toast-card").filter({ hasText: /Failed|Error/i })).toBeVisible();
});

test("a 500 on validate surfaces an error and leaves the operator on Step 1", async ({ page }) => {
  await startPlan(page);
  await page.route("**/datasets/validate", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"detail":"boom"}' }),
  );

  await page.getByRole("button", { name: "Check Data →" }).click();

  await expect(page.locator(".toast-card").filter({ hasText: /Failed|Error/i })).toBeVisible();
  // Still on Select Data - no fabricated validation state was adopted.
  await expect(page.getByRole("button", { name: "Check Data →" })).toBeVisible();
  await expect(page.getByText("Dataset Validated & Ready")).toHaveCount(0);
});

// ------------------------------------------------------------------- solver

test("a 500 on planning-runs shows the failure and produces no phantom plan", async ({ page }) => {
  await startPlan(page);
  await page.getByRole("button", { name: "Check Data →" }).click();
  await expect(page.getByText("Backend hash")).toBeVisible();

  await page.route("**/planning-runs", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({ status: 500, contentType: "application/json", body: '{"detail":"boom"}' });
  });
  await page.getByRole("button", { name: /3\. Create Plan/ }).click();

  await expect(page.locator(".rn-solver-error")).toBeVisible({ timeout: 15_000 });
  // The review screen must never appear for a run that failed to be created.
  await expect(page.getByText("Plan Quality")).toHaveCount(0);
});

for (const state of ["INFEASIBLE", "TIMEOUT"] as const) {
  test(`a ${state} run cannot be approved, and says why`, async ({ page }) => {
    await stubRunState(page, (body) => {
      body.state = state;
      body.export_ready = false;
    });
    await reachReview(page);

    const approve = page.getByRole("button", { name: "Approve Plan", exact: true });
    await expect(approve).toBeDisabled();
    await expect(page.locator(".rn-approve-blocked-hint")).toContainText(
      `Plan is not in an approvable state (${state})`,
    );
  });
}

test("a run whose safety validation failed cannot be approved, and says why", async ({ page }) => {
  await stubRunState(page, (body) => {
    body.validator = { passed: false, issues: [] };
    body.export_ready = false;
  });
  await reachReview(page);

  await expect(page.getByRole("button", { name: "Approve Plan", exact: true })).toBeDisabled();
  await expect(page.locator(".rn-approve-blocked-hint")).toContainText(
    "Independent safety validation failed",
  );
});

// ------------------------------------------------------------------- guards

test("a pending edit blocks approval until the plan is re-optimized", async ({ page }) => {
  await reachReview(page);
  await expect(page.getByRole("button", { name: "Approve Plan", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: "Select JOB-001 (SCHEDULED)" }).click();
  await page.getByRole("button", { name: /Exclude from Plan/ }).click();
  await expect(page.getByText(/move\/exclusion intent/)).toBeVisible();

  await expect(page.getByRole("button", { name: "Approve Plan", exact: true })).toBeDisabled();
  await expect(page.locator(".rn-approve-blocked-hint")).toContainText(
    "Re-optimize the plan before approving",
  );
});

test("export before approval is refused by the backend and surfaced, not silently swallowed", async ({
  page,
}) => {
  await reachReview(page);

  // Reach the sign-off step, where Export sits next to Approve, and export
  // without approving first.
  await page.getByRole("button", { name: "Approve Plan", exact: true }).click();
  const exportResponse = page.waitForResponse((r) => r.url().includes("/export"));
  await page.getByRole("button", { name: /Export/ }).first().click();

  expect((await exportResponse).status()).toBe(409);
  await expect(page.locator(".toast-card").filter({ hasText: /Export Failed/i })).toBeVisible();
});

// --------------------------------------------------------------- rapidblock

test("emergency planning is unreachable until a plan exists", async ({ page }) => {
  await page.goto("/");

  const emergency = page.getByRole("button", { name: /Emergency Block Planning/ });
  await expect(emergency).toBeDisabled();
  await expect(emergency).toContainText("Create a plan first");
});

test("a backend-rejected emergency request surfaces its reason code", async ({ page }) => {
  await reachReview(page);
  await page.route("**/rapidblock-requests", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        code: "ACTOR_NOT_ALLOWED",
        message: "Actor is outside the demo allowlist",
      }),
    });
  });

  // Navigate in-app: a full page load would drop the plan that unlocks this
  // entry point, which is what the previous test asserts.
  await page.getByRole("button", { name: "RailNiyojan" }).click();
  await page.getByRole("button", { name: /Emergency Block Planning/ }).click();
  await page.getByRole("button", { name: /Inject & Re-Optimize Plan/ }).click();

  const toast = page.locator(".toast-card").filter({ hasText: "RapidBlock Request Rejected" });
  await expect(toast).toBeVisible();
  // The reason, not a bare "rejected".
  await expect(toast).toContainText("ACTOR_NOT_ALLOWED");
  await expect(toast).toContainText("outside the demo allowlist");
});

// ------------------------------------------------------------------ safety

test("no prohibited railway-authority term appears anywhere in the workflow", async ({ page }) => {
  // docs/security_and_safety.md: this product is decision support. It does not
  // issue railway authority or dispatch trains, and its copy must not imply it.
  const prohibited = /\b(dispatch(ed|es|ing)?|authoriz(e|ed|es|ing|ation)|official clearance)\b/i;

  const assertClean = async (where: string) => {
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const match = text.match(prohibited);
    expect(match ? `${where}: "${match[0]}"` : null).toBeNull();
  };

  await page.goto("/");
  await assertClean("home");

  await reachReview(page);
  await assertClean("review");

  await page.getByRole("button", { name: "Approve Plan", exact: true }).click();
  await assertClean("approve step");

  await page.getByRole("button", { name: "Approve Plan" }).last().click();
  await expect(page.getByText(/Plan Approved|Approved/).first()).toBeVisible({ timeout: 15_000 });
  await assertClean("approved screen");
});

// ------------------------------------------------------------- known limits

test("a mid-workflow refresh says the plan is gone instead of pretending to resume", async ({
  page,
}) => {
  // Documented limitation, not a wish: all wizard state lives in React memory
  // with no persistence layer, so a refresh cannot resume the run. What matters
  // is that it degrades honestly - it does not show a stale or half-built plan,
  // and it offers a way out. Asserting the real behaviour keeps the gap visible
  // rather than encoding a recovery feature that does not exist.
  await reachReview(page);
  await page.reload();

  await expect(page.getByText("There is no active plan yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Back to Home/ })).toBeEnabled();
  await expect(page.getByText("Plan Quality")).toHaveCount(0);

  await page.getByRole("button", { name: /Back to Home/ }).click();
  await expect(page.getByRole("button", { name: /Start New Plan/ })).toBeVisible();
});
