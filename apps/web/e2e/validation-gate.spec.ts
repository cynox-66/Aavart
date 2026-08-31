import { expect, test, type Page } from "@playwright/test";

/**
 * Gap 12 regression. Step 2's Continue button and Step 3's solver used to read
 * different facts: Continue trusted local React state that "Mark as Resolved"
 * and "Auto-Fix All" flipped to valid, while the solver required the snapshot
 * candidate the backend registers only for a clean dataset. The operator was let
 * through one gate and stopped by the next.
 *
 * Both now read `snapshot_candidate_id`, and the local-state controls are gone
 * entirely - which makes the bug structurally impossible rather than merely
 * fixed. These tests assert both halves: the gate holds, and no control on the
 * screen can move it.
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
 * Every control the blocked screen offers. If any of these could unlock Continue
 * the original defect would be back, so the test drives all of them rather than
 * naming the two that used to exist.
 */
async function clickEveryControlOnTheBlockedScreen(page: Page) {
  const cards = page.locator(".issue-item-card");
  const total = await cards.count();
  expect(total).toBeGreaterThan(1);

  // Expand every issue, which is the only interaction the accordion still has.
  for (let index = 0; index < total; index += 1) {
    await cards.nth(index).locator(".issue-header-row").click();
  }

  // Nothing in the issue list may offer to fix, resolve or auto-fix anything.
  const banned = /mark as resolved|auto-fix|resolve|acknowledge/i;
  for (const label of await page.locator(".validation-needs-attention-card button").allInnerTexts()) {
    expect(label).not.toMatch(banned);
  }
}

test("a backend-rejected dataset never reaches the solver, whatever is clicked", async ({
  page,
}) => {
  const solverCalls: string[] = [];
  await page.route("**/planning-runs", async (route) => {
    solverCalls.push(route.request().method());
    await route.continue();
  });

  await gotoRejectedCheckData(page);
  await expect(continueButton(page)).toBeDisabled();

  // Exercise every control the screen still offers - none may unlock Continue.
  await clickEveryControlOnTheBlockedScreen(page);
  await expect(continueButton(page)).toBeDisabled();
  expect(solverCalls.filter((method) => method === "POST")).toHaveLength(0);
});

test("the validated banner cannot appear without a registered snapshot", async ({ page }) => {
  await gotoRejectedCheckData(page);

  await expect(page.getByText("Dataset Validated & Ready")).toHaveCount(0);
  await expect(page.getByText("Backend hash")).toHaveCount(0);
  // The snapshot pill is the fact the gate reads; it must show it has none.
  await expect(page.locator(".snapshot-id")).toHaveText("—");

  await clickEveryControlOnTheBlockedScreen(page);

  await expect(page.getByText("Dataset Validated & Ready")).toHaveCount(0);
  await expect(page.getByText("Backend validation must pass before the solver can run")).toBeVisible();
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
