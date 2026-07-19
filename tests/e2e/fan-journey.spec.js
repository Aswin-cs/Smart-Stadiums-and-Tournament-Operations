const { test, expect } = require('@playwright/test');

test.describe('Fan Journey', () => {
  test('should navigate to dashboard and view tickets', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Stadium/i);

    // Navigate to Fan dashboard
    await page.goto('/fan');
    
    // Wait for the Fan Dashboard header or elements
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=My Tickets').first()).toBeVisible();
    
    // We expect tickets to load or show empty state depending on DB mock, 
    // since this is an E2E test hitting Next.js dev server, we can verify basic rendering.
    // Ensure that main dashboard container is rendered
    await expect(page.locator('main')).toBeVisible();
  });
});
