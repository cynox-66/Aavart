import { expect, test } from "@playwright/test";

test("renders the RailNiyojan foundation boundary", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("RailNiyojan");
  await expect(page.getByRole("heading", { name: "Foundation boundary" })).toBeVisible();
  await expect(page.getByText("Not for operational sanctioning.")).toBeVisible();
});

