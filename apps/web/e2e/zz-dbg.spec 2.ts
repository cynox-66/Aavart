import { test } from "@playwright/test";
test("dbg", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start New Plan/ }).click();
  await page.getByRole("radio", { name: /Baseline Test Corridor/ }).click();
  await page.getByRole("button", { name: "Check Data →" }).click();
  await page.getByRole("button", { name: /3\. Create Plan/ }).click();
  await page.getByText("Plan Quality").waitFor({ timeout: 20000 });
  console.log("=== BEFORE RELOAD url:", page.url());
  await page.reload();
  await page.waitForTimeout(3000);
  console.log("=== AFTER RELOAD url:", page.url());
  console.log("=== BODY:", (await page.locator("body").innerText()).replace(/\s+/g," ").slice(0, 600));
  console.log("=== BUTTONS:", (await page.getByRole("button").allInnerTexts()).map(t=>t.replace(/\s+/g," ").slice(0,40)).join(" | "));
});
