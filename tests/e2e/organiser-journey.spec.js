const { test, expect } = require('@playwright/test');

test.describe('Organiser Journey', () => {
  test('should navigate to organiser dashboard and see stats', async ({ page }) => {
    // Navigate to Organiser dashboard
    await page.goto('/organiser');
    
    // Ensure the Organiser Dashboard header or elements are visible
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Assuming OrganiserStatsRow or something similar is present
    await expect(page.locator('text=Total Revenue').first()).toBeVisible();
    
    // Check if map or stadium layout section is present
    await expect(page.locator('text=Stadium Layout').first()).toBeVisible();
    
    // Ensure that main dashboard container is rendered
    await expect(page.locator('main')).toBeVisible();
  });
});
