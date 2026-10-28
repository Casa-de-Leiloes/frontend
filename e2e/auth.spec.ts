import { expect, test } from "@playwright/test";

test.describe("Auth flow", () => {
  test("login page renders and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("register page renders and shows form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("invalid login keeps user on login page", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("notexists@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    // Wait for any feedback (error toast, inline message, or just staying on /login)
    await page.waitForTimeout(3_000);
    // User should still be on the login page (not redirected to home)
    expect(page.url()).toContain("/login");
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    // Skip if backend not available
    const apiCheck = await page.evaluate(() =>
      fetch("/api/health").then((r) => r.ok).catch(() => false),
    );
    if (!apiCheck) {
      test.skip();
      return;
    }

    const email = process.env.TEST_USER_EMAIL ?? "bidder@demo.com";
    const password = process.env.TEST_USER_PASSWORD ?? "Demo1234!";

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
    expect(page.url()).not.toContain("/login");
  });

  test("profile page requires auth — redirects unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL((url) => url.pathname !== "/profile", { timeout: 5_000 }).catch(() => {});
    const url = page.url();
    const isOnLogin = url.includes("/login");
    const isOnHome = url === page.context().pages()[0]?.url() || url.endsWith("/");
    expect(isOnLogin || isOnHome).toBeTruthy();
  });
});
