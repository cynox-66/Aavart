import { expect, test, type Page } from "@playwright/test";

/**
 * Gap 12 regression. Step 2's Continue button and Step 3's solver used to read
 * different facts: Continue trusted local React state that "Mark as Resolved"
 * flipped to valid, while the solver required the snapshot candidate the backend
 * registers only for a clean dataset. The operator was let through one gate and
 * stopped by the next. Both now read `snapshot_candidate_id`, so a rejected
 * dataset must stay rejected no matter what is clicked on this screen.
 */

const REJECTED_VALIDATION = {
  valid: false,
  snapshot_candidate_id: null,
  source_hash: null,
  errors: [
    {
      code: "DURATION_EXCEEDS_WINDOW",
      message: "JOB-002 needs 240 minutes but WIN-001 is 180 minutes long.",
      field: "duration_minutes",
      row: 2,
    },
    {
      code: "UNKNOWN_WINDOW",
      message: "JOB-003 references WIN-404, which is not in the dataset.",
      field: "allowed_windows",
      row: 3,
    },
  ],
  counts: { jobs: 4, windows: 3, assets: 2, sections: 2, resources: 2 },
  source_summaries: [],
};

async function stubRejectedValidation(page: Page) {
  await page.route("**/datasets/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(REJECTED_VALIDATION),
    });
  });
}

async function gotoRejectedCheckData(page: Page) {
  await stubRejectedValidation(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Start New Plan/ }).click();
  await page.getByRole("radio", { name: /Baseline Test Corridor/ }).click();
  await page.getByRole("button", { name: "Check Data →" }).click();
  await expect(page.getByRole("heading", { name: /Rejected by validation/ })).toBeVisible();
}

const continueButton = (page: Page) => page.getByRole("button", { name: /3\. Create Plan/ });

/**
 * Acknowledge every issue, not just the one the accordion opens on. Only the
 * expanded card exposes its Acknowledge button, so each card has to be opened
 * first - a loop over the visible buttons alone stops after one issue and would
 * leave the old, gameable gate still closed.
 */
async function acknowledgeEveryIssue(page: Page) {
  const cards = page.locator(".issue-item-card");
  const total = await cards.count();
  expect(total).toBeGreaterThan(1);

  for (let index = 0; index < total; index += 1) {
    const card = cards.nth(index);
    if ((await card.getByRole("button", { name: "✓ Acknowledge" }).count()) === 0) {
      await card.locator(".issue-header-row").click();
    }
    await card.getByRole("button", { name: "✓ Acknowledge" }).click();
  }

  await expect(page.locator(".issue-item-card.resolved")).toHaveCount(total);
}

test("a backend-rejected dataset never reaches the solver, however many issues are acknowledged", async ({
  page,
}) => {
  const solverCalls: string[] = [];
  await page.route("**/planning-runs", async (route) => {
    solverCalls.push(route.request().method());
    await route.continue();
  });

  await gotoRejectedCheckData(page);
  await expect(continueButton(page)).toBeDisabled();

  // Acknowledge every issue - the exact gesture that used to unlock Continue.
  await acknowledgeEveryIssue(page);
  await expect(continueButton(page)).toBeDisabled();
  expect(solverCalls.filter((method) => method === "POST")).toHaveLength(0);
});

test("the validated banner cannot appear without a registered snapshot", async ({ page }) => {
  await gotoRejectedCheckData(page);

  await expect(page.getByText("Dataset Validated & Ready")).toHaveCount(0);
  await expect(page.getByText("Backend hash")).toHaveCount(0);
  // The snapshot pill is the fact the gate reads; it must show it has none.
  await expect(page.locator(".snapshot-id")).toHaveText("—");

  await acknowledgeEveryIssue(page);

  await expect(page.getByText("Dataset Validated & Ready")).toHaveCount(0);
  await expect(page.getByText("No validated snapshot")).toBeVisible();
});

test("the blocked state offers a way back to Select Data", async ({ page }) => {
  await gotoRejectedCheckData(page);

  await page
    .locator(".validation-needs-attention-card")
    .getByRole("button", { name: /Back to Select Data/ })
    .click();

  await expect(page.getByRole("button", { name: "Check Data →" })).toBeVisible();
});

test("a clean dataset still registers a snapshot and unlocks the solver", async ({ page }) => {
  // Guards the stub above from drifting into a gate nothing can ever pass.
  await page.goto("/");
  await page.getByRole("button", { name: /Start New Plan/ }).click();
  await page.getByRole("radio", { name: /Baseline Test Corridor/ }).click();
  await page.getByRole("button", { name: "Check Data →" }).click();

  await expect(page.getByText("Dataset Validated & Ready")).toBeVisible();
  await expect(page.locator(".snapshot-id")).not.toHaveText("—");
  await expect(continueButton(page)).toBeEnabled();
});
