import { expect, test } from "@playwright/test";

test("renders the RailNiyojan planning desk", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("RailNiyojan");
  await expect(page.getByRole("heading", { name: "Build a reviewable block plan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1. Validate dataset" })).toBeVisible();
  await expect(page.getByText("Not for operational sanctioning.")).toBeVisible();
});

test("completes the guarded planning workflow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "1. Validate dataset" }).click();
  await expect(page.getByText("Dataset valid")).toBeVisible();

  await page.getByRole("button", { name: "2. Create plan" }).click();
  await expect(page.getByText("OPTIMAL", { exact: true })).toBeVisible();
  await expect(page.getByText("TRAIN_PATH_CONFLICT")).toBeVisible();

  const jobOne = page.locator(".schedule-row").filter({ hasText: "JOB-001" });
  await jobOne.getByRole("button", { name: "Lock" }).click();
  await expect(jobOne.getByRole("button", { name: "Locked" })).toBeVisible();

  await page.getByRole("button", { name: "3. Re-plan affected work" }).click();
  await expect(page.getByText("LOCK_PRESERVED")).toBeVisible();

  await page.getByRole("button", { name: "4. Approve" }).click();
  await expect(page.getByRole("button", { name: "Approved" })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "5. Export CSV" }).click();
  await download;
});
