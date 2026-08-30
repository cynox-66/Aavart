import { test } from "@playwright/test";
test("shot", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: /Start New Plan/ }).click();
  await page.getByRole("radio", { name: /Baseline Test Corridor/ }).click();
  await page.getByRole("button", { name: "Check Data →" }).click();
  await page.getByRole("button", { name: /3\. Create Plan/ }).click();
  await page.getByText("Plan Quality").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await page.locator(".rn-plan-impact-card").screenshot({ path: "/tmp/impact.png" });
  await page.screenshot({ path: "/tmp/review.png", fullPage: false });
});
