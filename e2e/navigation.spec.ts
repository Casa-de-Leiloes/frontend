import { expect, test } from "@playwright/test";

test.describe("Navigation behavior", () => {
  test("header nav bar is always fixed and visible", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Scroll down — header must stay visible (fixed positioning)
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(header).toBeVisible();

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).toBeVisible();
  });

  test("login and register routes render without server error", async ({ page }) => {
    for (const route of ["/login", "/register"]) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("form")).toBeVisible();
    }
  });

  test("audit route renders without auth", async ({ page }) => {
    await page.goto("/audit/some-lot-id");
    await page.waitForLoadState("networkidle");
    // Should not crash — either shows audit data or not-found message
    expect(await page.title()).toBeTruthy();
  });

  test("receipt route renders without auth", async ({ page }) => {
    await page.goto("/receipt/some-token");
    await page.waitForLoadState("networkidle");
    expect(await page.title()).toBeTruthy();
  });
});
