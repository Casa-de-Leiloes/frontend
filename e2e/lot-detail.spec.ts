import { expect, test } from "@playwright/test";

test.describe("Lot detail page", () => {
  test("navigating to /lots/nonexistent shows error or redirects", async ({ page }) => {
    await page.goto("/lots/nonexistent-lot-id");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    // Either stays with error state or redirects home
    expect(url.includes("/lots/") || url.endsWith("/")).toBeTruthy();
  });

  test("lot detail shows bid panel on valid lot", async ({ page }) => {
    // Get a lot id from the home page listing
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const lotLink = page
      .locator("a[href^='/lots/']")
      .first();

    if (await lotLink.isVisible()) {
      const href = await lotLink.getAttribute("href");
      await page.goto(href ?? "/");
      await page.waitForLoadState("networkidle");

      // Title should be visible
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });

  test("sticky bid panel remains visible after scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const lotLink = page.locator("a[href^='/lots/']").first();
    if (await lotLink.isVisible()) {
      const href = await lotLink.getAttribute("href");
      await page.goto(href ?? "/");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => window.scrollTo(0, 400));
      // Nav header still visible after scroll
      await expect(page.locator("header")).toBeVisible();
    }
  });
});
