import { expect, test } from "@playwright/test";

test.describe("PitchIQ landing", () => {
  test("loads the marketing landing", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/PitchIQ/i);
    // Hero CTA should be present
    await expect(page.getByRole("link", { name: /start for free|sign in|join/i }).first()).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });
});
