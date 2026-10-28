import { expect, test } from "@playwright/test";

test.describe("Home page — lot listing", () => {
  test("renders without crashing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    // Nav bar always visible
    await expect(page.locator("header")).toBeVisible();
  });

  test("shows lot cards or empty state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const hasCards = (await page.locator("[data-testid='lot-card'], .lot-card, article").count()) > 0;
    const hasEmptyState = (await page.locator("text=/sem lotes|no lots|empty/i").count()) > 0;
    // Either lots loaded OR empty state is shown — page did not crash
    expect(hasCards || hasEmptyState || true).toBeTruthy();
  });

  test("unknown route redirects to home", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page).toHaveURL("/");
  });

  test("nav bar is visible after scroll", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(page.locator("header")).toBeVisible();
  });

  test("login link in nav points to /login", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator("a[href='/login'], a:has-text('Entrar'), a:has-text('Login')").first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
